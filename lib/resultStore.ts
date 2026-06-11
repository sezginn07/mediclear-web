// Hands the analysis result from the analyze page to the results page without a
// backend. sessionStorage (not localStorage) so it clears when the tab closes.
import type { AnalysisResult } from './types';

const KEY = 'mediclear_web_last_result';

export function saveResult(result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadResult(): AnalysisResult | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}
