// Server-side port of the mobile app's src/services/analyzeReport.ts.
//
// The browser never talks to Anthropic directly. The request flows:
//   browser → /api/analyze (Next route) → lib/analysis.ts → Cloudflare Worker → Anthropic
//
// The Worker holds the real Anthropic API key in its secret store. This file
// only knows the public proxy URL + app token (NOT secret — see .env.example).

import type {
  AnalysisResult,
  AnalysisStatus,
  AnthropicMediaType,
  CategoryId,
  Lang,
} from './types';
import { buildSystemPrompt } from './prompts';

// Identical to the mobile app's USER_PROMPT.
const USER_PROMPT =
  'Analyze this medical report following your instructions exactly. Return only valid JSON.';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

export class AnalyzeReportError extends Error {
  constructor(
    message: string,
    readonly code: 'config' | 'auth' | 'rate_limit' | 'server' | 'parse' | 'network',
  ) {
    super(message);
    this.name = 'AnalyzeReportError';
  }
}

interface AnalyzeArgs {
  base64Data: string;
  mediaType: AnthropicMediaType;
  category: CategoryId;
  lang: Lang;
}

// ─── Content block ───────────────────────────────────────────────────────────
// PDFs go through the `document` block; images through the `image` block.
// Both use base64 source, matching the mobile implementation.
function buildFileBlock(base64Data: string, mediaType: AnthropicMediaType) {
  if (mediaType === 'application/pdf') {
    return {
      type: 'document' as const,
      source: { type: 'base64' as const, media_type: mediaType, data: base64Data },
    };
  }
  return {
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: mediaType, data: base64Data },
  };
}

// ─── JSON extraction ─────────────────────────────────────────────────────────
// The model is asked for raw JSON, but may wrap it in a markdown fence or add
// prose. Try a fenced block first, then the first bare {...} object.
export function extractJsonFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : text;

  try {
    return JSON.parse(candidate.trim());
  } catch {
    // fall through to bare-object scan
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      // fall through
    }
  }
  throw new AnalyzeReportError('Model did not return valid JSON.', 'parse');
}

// ─── Status normalization ────────────────────────────────────────────────────
// The model may emit a localized or free-form status. Map to the three
// language-neutral values. Turkish 'acil' → urgent, 'dikkat' → warning.
function normalizeStatus(raw: unknown): AnalysisStatus {
  const s = String(raw ?? '').toLowerCase().trim();
  if (['urgent', 'acil', 'red', 'kırmızı', 'kirmizi'].some((k) => s.includes(k))) {
    return 'urgent';
  }
  if (
    ['warning', 'dikkat', 'caution', 'yellow', 'sarı', 'sari', 'amber'].some((k) =>
      s.includes(k),
    )
  ) {
    return 'warning';
  }
  return 'normal';
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter((x) => x.trim().length > 0);
}

// Default disclaimers, matching the mobile app's normalizeResult fallback.
const DEFAULT_DISCLAIMER: Record<Lang, string> = {
  tr: 'Bu analiz yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez. Sonuçlarınızı mutlaka bir hekimle değerlendirin.',
  en: 'This analysis is for informational purposes only and is not a substitute for medical advice. Always review your results with a physician.',
};

export function normalizeResult(raw: unknown, lang: Lang): AnalysisResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    summary: String(obj.summary ?? '').trim(),
    status: normalizeStatus(obj.status),
    keyFindings: asStringArray(obj.keyFindings),
    doctorQuestions: asStringArray(obj.doctorQuestions),
    doList: asStringArray(obj.doList),
    dontList: asStringArray(obj.dontList),
    urgency: String(obj.urgency ?? '').trim(),
    disclaimer: String(obj.disclaimer ?? '').trim() || DEFAULT_DISCLAIMER[lang],
  };
}

// ─── HTTP error mapping ──────────────────────────────────────────────────────
function mapApiError(status: number): AnalyzeReportError {
  if (status === 401 || status === 403) {
    return new AnalyzeReportError('Proxy rejected the app token.', 'auth');
  }
  if (status === 429) {
    return new AnalyzeReportError('Rate limited by the analysis service.', 'rate_limit');
  }
  return new AnalyzeReportError(`Analysis service error (${status}).`, 'server');
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export async function analyzeReport({
  base64Data,
  mediaType,
  category,
  lang,
}: AnalyzeArgs): Promise<AnalysisResult> {
  // Server-only env vars (no NEXT_PUBLIC_ — only this server route needs them).
  // The NEXT_PUBLIC_ variants are read as a fallback for older deployments.
  const proxyUrl = process.env.PROXY_URL ?? process.env.NEXT_PUBLIC_PROXY_URL;
  const appToken = process.env.APP_TOKEN ?? process.env.NEXT_PUBLIC_APP_TOKEN;

  if (!proxyUrl || !appToken) {
    throw new AnalyzeReportError(
      'PROXY_URL / APP_TOKEN are not configured.',
      'config',
    );
  }

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(lang, category),
    messages: [
      {
        role: 'user' as const,
        content: [
          buildFileBlock(base64Data, mediaType),
          { type: 'text' as const, text: USER_PROMPT },
        ],
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch(`${proxyUrl.replace(/\/$/, '')}/analyze`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-app-token': appToken,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AnalyzeReportError('Could not reach the analysis service.', 'network');
  }

  if (!response.ok) {
    throw mapApiError(response.status);
  }

  // The Worker forwards Anthropic's Messages API response shape:
  // { content: [{ type: 'text', text: '...' }, ...], ... }
  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = (payload.content ?? [])
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
    .trim();

  if (!text) {
    throw new AnalyzeReportError('Empty response from the analysis service.', 'parse');
  }

  return normalizeResult(extractJsonFromText(text), lang);
}
