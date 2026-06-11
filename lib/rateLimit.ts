// Simple fixed-window in-memory rate limiter for /api/analyze.
//
// CAVEAT: on serverless (Vercel) each warm instance has its own Map, so the
// effective limit is per-instance, not global. That still blocks the common
// abuse pattern (one client hammering one warm function). A global limit
// would need Redis/Upstash — documented trade-off for this build.

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

const windows = new Map<string, Window>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const win = windows.get(ip);

  if (!win || now >= win.resetAt) {
    windows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (win.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000) };
  }

  win.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// Best-effort client IP behind Vercel's proxy.
export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// Periodically drop expired windows so the Map doesn't grow unbounded.
export function pruneExpired(): void {
  const now = Date.now();
  for (const [ip, win] of windows) {
    if (now >= win.resetAt) windows.delete(ip);
  }
}
