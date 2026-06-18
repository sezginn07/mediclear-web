-- IMPORTANT: After running this schema in Supabase SQL Editor,
-- also configure in Supabase Dashboard:
-- 1. Authentication > URL Configuration > Site URL: http://localhost:3000
-- 2. Authentication > URL Configuration > Redirect URLs:
--    add http://localhost:3000/auth/callback and your production URL/auth/callback
-- 3. Authentication > Providers > Google: enable and add Client ID + Secret from Google Cloud Console

-- ── Profiles ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                     UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                  TEXT        NOT NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  is_premium             BOOLEAN     DEFAULT FALSE,
  premium_expires_at     TIMESTAMPTZ,
  stripe_customer_id     TEXT,
  analysis_count_monthly INTEGER     DEFAULT 0,
  analysis_reset_date    DATE        DEFAULT CURRENT_DATE,
  email_confirmed        BOOLEAN     DEFAULT FALSE,
  kvkk_consent           BOOLEAN     DEFAULT FALSE NOT NULL
);

-- Safe migration for existing installs (adds columns if not already present)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kvkk_consent BOOLEAN DEFAULT FALSE NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Referral loop columns (viral growth):
--   referred_by     — the user id from the ?ref= link the new user signed up with
--   referral_count  — how many people this user has referred (shown in account)
--   bonus_analyses  — extra free analyses earned via referrals
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by    UUID;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0 NOT NULL;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_analyses INTEGER DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ── Server-side rate limiting (per IP hash, fixed 1-hour window) ──────────
-- Replaces the in-memory limiter, which reset on every serverless cold start.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip_hash      TEXT        PRIMARY KEY,
  count        INTEGER     DEFAULT 0 NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service-role client (and SECURITY DEFINER fns) touch it.

-- Atomically count a request and report whether it is within the limit.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_hash TEXT,
  p_max INT DEFAULT 10,
  p_window_seconds INT DEFAULT 3600
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
BEGIN
  INSERT INTO public.rate_limits AS rl (ip_hash, count, window_start)
  VALUES (p_ip_hash, 1, NOW())
  ON CONFLICT (ip_hash) DO UPDATE SET
    count = CASE
      WHEN rl.window_start < NOW() - make_interval(secs => p_window_seconds) THEN 1
      ELSE rl.count + 1
    END,
    window_start = CASE
      WHEN rl.window_start < NOW() - make_interval(secs => p_window_seconds) THEN NOW()
      ELSE rl.window_start
    END
  RETURNING count INTO current_count;
  RETURN current_count <= p_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically consume one analysis credit. Returns FALSE when the user is at
-- their limit (the UPDATE matches no row), so check-then-increment races are
-- impossible. p_limit is the caller-computed effective limit
-- (premium: 10/month; free: 2 lifetime + bonus_analyses).
CREATE OR REPLACE FUNCTION public.increment_analysis_count(
  p_user_id UUID,
  p_limit INT
)
RETURNS BOOLEAN AS $$
DECLARE
  updated INT;
BEGIN
  UPDATE public.profiles
  SET analysis_count_monthly = analysis_count_monthly + 1
  WHERE id = p_user_id
    AND analysis_count_monthly < p_limit
    -- Callers may only consume their own credits (service role bypasses).
    AND (auth.uid() IS NULL OR auth.uid() = p_user_id)
  RETURNING 1 INTO updated;
  RETURN updated IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund one credit when the AI call fails after the credit was consumed.
-- Service-role only: if users could call this they could refund themselves
-- unlimited credits.
CREATE OR REPLACE FUNCTION public.decrement_analysis_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'decrement_analysis_count is service-role only';
  END IF;
  UPDATE public.profiles
  SET analysis_count_monthly = GREATEST(analysis_count_monthly - 1, 0)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Analyses ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analyses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  report_name      TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  language         TEXT        NOT NULL DEFAULT 'tr',
  status           TEXT        NOT NULL,
  summary          TEXT        NOT NULL,
  key_findings     JSONB       DEFAULT '[]',
  doctor_questions JSONB       DEFAULT '[]',
  do_list          JSONB       DEFAULT '[]',
  dont_list        JSONB       DEFAULT '[]',
  urgency          TEXT,
  disclaimer       TEXT
);

-- ── Auto-create profile on sign-up ────────────────────────────────────────
--
-- NOTE on provider detection:
--   Google OAuth stores provider info in raw_app_meta_data, NOT raw_user_meta_data.
--   Use raw_app_meta_data->>'provider' to detect OAuth sign-ups.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, email_confirmed, kvkk_consent)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    CASE
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN TRUE
      WHEN NEW.raw_app_meta_data->>'provider' IN ('github', 'apple') THEN TRUE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE
      ELSE FALSE
    END,
    COALESCE((NEW.raw_user_meta_data->>'kvkk_consent')::boolean, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email_confirmed = CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE
      ELSE profiles.email_confirmed
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses  ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Analyses
DROP POLICY IF EXISTS "Users can read own analyses"   ON public.analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;

CREATE POLICY "Users can read own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS analyses_user_id_created_at_idx
  ON public.analyses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

/*
FUTURE: Add pg_cron cleanup job in Supabase Dashboard > Database > Extensions > pg_cron:
SELECT cron.schedule('cleanup-old-analyses', '0 3 * * *',
  'DELETE FROM analyses WHERE created_at < NOW() - INTERVAL ''7 days'''
);
This runs daily at 3am UTC. Not required for MVP — query-level filter is sufficient.
*/
