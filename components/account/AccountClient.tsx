'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import type { Analysis, Profile } from '@/lib/supabase/types';

const CATEGORY_EMOJI: Record<string, string> = {
  blood: '🩸', radiology: '🔬', pathology: '🧫',
  cardiology: '❤️', hormone: '⚗️', general: '📋',
};

const STATUS_CLASS: Record<string, string> = {
  normal: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  urgent: 'bg-red-100 text-red-700',
};

function groupByDate(
  analyses: Analysis[],
  todayLabel: string,
  yesterdayLabel: string,
): Array<{ label: string; items: Analysis[] }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const map = new Map<string, Analysis[]>();
  for (const a of analyses) {
    const d = new Date(a.created_at);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = todayLabel;
    else if (d.getTime() === yesterday.getTime()) label = yesterdayLabel;
    else label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    const existing = map.get(label) ?? [];
    existing.push(a);
    map.set(label, existing);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

interface Props {
  profile: Profile | null;
  analyses: Analysis[];
  userEmail: string;
}

export function AccountClient({ profile, analyses, userEmail }: Props) {
  const t = useTranslations('account');
  const locale = useLocale();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const isPremium = profile?.is_premium ?? false;
  const count = profile?.analysis_count_monthly ?? 0;
  const limit = isPremium ? 10 : 2;

  const avatarLetter = (userEmail?.[0] ?? '?').toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(locale === 'tr' ? 'Geçerli bir e-posta adresi girin.' : 'Enter a valid email address.');
      return;
    }
    if (trimmed === userEmail.toLowerCase()) {
      setEmailError(locale === 'tr' ? 'Bu zaten mevcut email adresiniz.' : 'This is already your current email.');
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ email: trimmed });
      if (error) { setEmailError(error.message); return; }
      setEmailSuccess(true);
      setShowEmailForm(false);
      setNewEmail('');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = `/${locale}`;
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) throw new Error('delete_failed');
      window.location.href = `/${locale}`;
    } catch {
      setDeleteError(locale === 'tr' ? 'Hesap silinemedi. Lütfen tekrar deneyin.' : 'Could not delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  const grouped = groupByDate(analyses, t('history.today'), t('history.yesterday'));

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('profile.title')}</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
            {avatarLetter}
          </div>
          <div>
            <p className="font-medium text-foreground">{userEmail}</p>
            <p className="text-xs text-muted">{t('profile.memberSince')}: {memberSince}</p>
          </div>
        </div>
      </Card>

      {/* Email change */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('emailChange.title')}</h2>
          <button
            onClick={() => { setShowEmailForm((v) => !v); setEmailError(''); setEmailSuccess(false); }}
            className="text-xs font-medium text-primary hover:underline"
          >
            {showEmailForm ? t('emailChange.cancel') : t('emailChange.toggle')}
          </button>
        </div>
        <p className="mt-1 text-sm text-foreground">{userEmail}</p>

        {emailSuccess && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {t('emailChange.success')}
          </p>
        )}

        {showEmailForm && (
          <form onSubmit={handleEmailChange} className="mt-4 space-y-3" noValidate>
            <input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('emailChange.placeholder')}
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {emailError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{emailError}</p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {emailLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t('emailChange.submitting')}
                </>
              ) : t('emailChange.submit')}
            </button>
          </form>
        )}
      </Card>

      {/* Plan */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('plan.title')}</h2>
        <div className="mt-4 flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isPremium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            {isPremium ? t('plan.premium') : t('plan.free')}
          </span>
          {!isPremium && (
            <Link
              href="/pricing"
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {t('plan.upgrade')}
            </Link>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">
          {isPremium
            ? t('plan.premiumUsage', { count, limit })
            : t('plan.freeUsage', { count, limit })}
        </p>
        {isPremium && profile?.premium_expires_at && (
          <p className="mt-1 text-xs text-muted">
            {t('plan.renewalDate')}:{' '}
            {new Date(profile.premium_expires_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </Card>

      {/* Referral loop */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('referral.title')}</h2>
        {(() => {
          // Columns exist after the referral migration; default to 0 on older DBs.
          const p = profile as (Profile & { referral_count?: number; bonus_analyses?: number }) | null;
          const refCount = p?.referral_count ?? 0;
          const bonus = p?.bonus_analyses ?? 0;
          return refCount > 0 ? (
            <p className="mt-3 text-sm text-foreground">
              🎁 {t('referral.stats', { count: refCount, bonus })}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">{t('referral.empty')}</p>
          );
        })()}
      </Card>

      {/* Analysis history */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('history.title')}</h2>
        {!isPremium ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
            <span className="text-3xl">🔒</span>
            <p className="text-sm text-muted">{t('history.locked')}</p>
            <Link href="/pricing" className="mt-1 text-sm font-medium text-primary hover:underline">
              {t('plan.upgrade')}
            </Link>
          </div>
        ) : analyses.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
            <span aria-hidden="true" className="text-4xl">🌱</span>
            <p className="text-sm font-medium text-foreground">{t('history.empty')}</p>
            <p className="max-w-xs text-xs text-muted">{t('history.emptyHint')}</p>
            <Link
              href="/analyze"
              className="mt-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {t('history.emptyCta')}
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <div className="space-y-2">
                  {items.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{CATEGORY_EMOJI[a.category] ?? '📋'}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.report_name}</p>
                          <p className="text-xs text-muted">
                            {new Date(a.created_at).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
      >
        {t('signOut')}
      </button>

      {/* Danger zone */}
      <Card className="border-red-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">{t('dangerZone.title')}</h2>
        <p className="mt-2 text-sm text-muted">{t('dangerZone.deleteWarning')}</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          {t('dangerZone.deleteAccount')}
        </button>
      </Card>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl">
            <h3 className="font-bold text-foreground">{t('dangerZone.deleteAccount')}</h3>
            <p className="mt-2 text-sm text-muted">{t('dangerZone.deleteWarning')}</p>
            <p className="mt-4 text-sm font-medium text-foreground">{t('dangerZone.deleteConfirmPrompt')}</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={t('dangerZone.deleteConfirmPlaceholder')}
              className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
            />
            {deleteError && (
              <p className="mt-2 text-sm text-red-600">{deleteError}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-foreground hover:bg-slate-50"
              >
                {t('dangerZone.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {t('dangerZone.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
