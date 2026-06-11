// Single source of truth for the app's absolute base URL.
//
// NEXT_PUBLIC_BASE_URL must be set to the canonical production origin
// (https://mediclear-web.vercel.app) in the Vercel environment so OAuth
// redirects never point at a preview URL or localhost.

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
