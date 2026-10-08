/** HTTP helpers: JSON responses, error envelope, body parsing, cookies. */
import type { ApiErrorBody, ErrorCode } from '../../shared/types';
import { LIMITS } from '../../shared/validation';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;
  readonly remainingAttempts?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    extra: { fields?: Record<string, string>; remainingAttempts?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (extra.fields !== undefined) this.fields = extra.fields;
    if (extra.remainingAttempts !== undefined) this.remainingAttempts = extra.remainingAttempts;
    if (extra.retryAfterSeconds !== undefined) this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

export const err = {
  validation: (fields: Record<string, string>, message = 'Please check the highlighted fields.') =>
    new ApiError(400, 'VALIDATION', message, { fields }),
  badRequest: (message = 'Malformed request.') => new ApiError(400, 'BAD_REQUEST', message),
  unauthenticated: () => new ApiError(401, 'UNAUTHENTICATED', 'Enter the group passcode to continue.'),
  pinRequired: () => new ApiError(403, 'PIN_REQUIRED', "This needs the owner's PIN."),
  forbidden: (message = 'Only the admin can do this.') => new ApiError(403, 'FORBIDDEN', message),
  notFound: (message = 'Not found.') => new ApiError(404, 'NOT_FOUND', message),
  conflict: (message = 'Someone else changed this at the same time. Please try again.') =>
    new ApiError(409, 'CONFLICT', message),
};

export function json(body: unknown, status = 200, headers?: Headers): Response {
  const h = new Headers(headers);
  h.set('Content-Type', 'application/json; charset=utf-8');
  h.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { status, headers: h });
}

export function noContent(headers?: Headers): Response {
  const h = new Headers(headers);
  h.set('Cache-Control', 'no-store');
  return new Response(null, { status: 204, headers: h });
}

export function errorResponse(e: ApiError, headers?: Headers): Response {
  const body: ApiErrorBody = {
    error: {
      code: e.code,
      message: e.message,
      ...(e.fields ? { fields: e.fields } : {}),
      ...(e.remainingAttempts !== undefined ? { remainingAttempts: e.remainingAttempts } : {}),
      ...(e.retryAfterSeconds !== undefined ? { retryAfterSeconds: e.retryAfterSeconds } : {}),
    },
  };
  const h = new Headers(headers);
  if (e.retryAfterSeconds !== undefined && e.status === 429) h.set('Retry-After', String(e.retryAfterSeconds));
  return json(body, e.status, h);
}

/** Reads a JSON object body. 415 when not JSON, 413 when over 16 KB, 400 when malformed. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  if (!type.startsWith('application/json')) {
    throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send JSON with Content-Type: application/json.');
  }
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > LIMITS.maxBodyBytes) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request is too large.');
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).length > LIMITS.maxBodyBytes) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request is too large.');
  }
  if (text.trim() === '') return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw err.badRequest('Request body is not valid JSON.');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw err.badRequest('Request body must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}

/* ---------- cookies ---------- */

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name && !(name in out)) out[name] = value;
  }
  return out;
}

export function isHttps(req: Request): boolean {
  const forwarded = req.headers.get('x-forwarded-proto');
  if (forwarded) return forwarded.split(',')[0]?.trim().toLowerCase() === 'https';
  try {
    return new URL(req.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export interface CookieOptions {
  /** seconds; omit for a browser-session cookie */
  maxAge?: number;
  sameSite: 'Lax' | 'Strict';
  secure: boolean;
}

export function serializeCookie(name: string, value: string, o: CookieOptions): string {
  const parts = [`${name}=${value}`, 'Path=/', 'HttpOnly', `SameSite=${o.sameSite}`];
  if (o.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(o.maxAge))}`);
  if (o.secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearedCookie(name: string, sameSite: 'Lax' | 'Strict', secure: boolean): string {
  return serializeCookie(name, '', { maxAge: 0, sameSite, secure });
}

export const COOKIE_NAMES = {
  group: 'fp_session',
  person: 'fp_person',
  admin: 'fp_admin',
} as const;

export const COOKIE_SAMESITE = { group: 'Lax', person: 'Lax', admin: 'Strict' } as const;
