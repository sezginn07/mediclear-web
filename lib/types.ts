// Core domain types — ported from the mobile app's src/types/report.ts and
// src/i18n/strings.ts, kept identical so the two products stay in sync.

export type Lang = 'tr' | 'en';

export type CategoryId =
  | 'blood'
  | 'radiology'
  | 'pathology'
  | 'cardiology'
  | 'hormone'
  | 'general';

export const CATEGORY_IDS: readonly CategoryId[] = [
  'blood',
  'radiology',
  'pathology',
  'cardiology',
  'hormone',
  'general',
] as const;

// Language-neutral status. Never a localized string — display text is resolved
// from translations (statusNormal / statusWarning / statusUrgent).
export type AnalysisStatus = 'normal' | 'warning' | 'urgent';

export interface AnalysisResult {
  summary: string;
  status: AnalysisStatus;
  keyFindings: string[];
  doctorQuestions: string[];
  doList: string[];
  dontList: string[];
  urgency: string;
  disclaimer: string;
}

export type AnthropicMediaType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

// File size limits — identical to the mobile app.
export const FILE_SIZE_WARN_BYTES = 10 * 1024 * 1024; // 10 MB
export const FILE_SIZE_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export const ACCEPTED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
