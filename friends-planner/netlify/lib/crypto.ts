/** scrypt PIN hashing, HMAC-signed tokens, sha256 helpers. */
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import type { AppConfig } from './config';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;

function scrypt(secret: string, salt: Buffer, keylen: number, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(secret, salt, keylen, { N, r, p, maxmem: 128 * N * r * 2 + 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

/** 'scrypt$16384$8$1$<saltB64url>$<hashB64url>' */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pin, salt, KEY_LEN, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N < 2 || N > 1 << 17) return false;
  const salt = Buffer.from(parts[4] ?? '', 'base64url');
  const expected = Buffer.from(parts[5] ?? '', 'base64url');
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = await scrypt(pin, salt, expected.length, N, r, p);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

/** Constant-time passcode comparison (hashes first so lengths never leak). */
export function passcodeEquals(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** First 32 hex characters of sha256(SESSION_SECRET|ip). Raw IPs are never stored. */
export function ipHash(secret: string, ip: string): string {
  return sha256Hex(`${secret}|${ip}`).slice(0, 32);
}

/** First 16 hex characters of sha256(pinHash); a PIN reset changes it. */
export function pinFingerprint(pinHash: string): string {
  return sha256Hex(pinHash).slice(0, 16);
}

export interface ScopeKeys {
  group: Buffer;
  admin: Buffer;
  person: Buffer;
}

/** Passcodes are part of the keys, so rotating a passcode invalidates every session of that scope. */
export function deriveKeys(config: Pick<AppConfig, 'sessionSecret' | 'groupPasscode' | 'adminPasscode'>): ScopeKeys {
  return {
    group: hmac(config.sessionSecret, `group|${config.groupPasscode}`),
    admin: hmac(config.sessionSecret, `admin|${config.adminPasscode}`),
    person: hmac(config.sessionSecret, 'person'),
  };
}

export type TokenScope = 'group' | 'admin' | 'person';

export interface TokenPayload {
  scope: TokenScope;
  /** seconds since epoch */
  iat: number;
  /** seconds since epoch */
  exp: number;
  pid?: string;
  pfp?: string;
}

/** 'v1.<payloadB64url>.<sigB64url>' */
export function signToken(payload: TokenPayload, key: Buffer): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(key, `v1.${body}`).toString('base64url');
  return `v1.${body}.${sig}`;
}

/** Returns the payload when signature, scope and expiry are all valid; otherwise null. `nowMs` is epoch ms. */
export function verifyToken(token: string | undefined, key: Buffer, scope: TokenScope, nowMs: number): TokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const body = parts[1] ?? '';
  const sig = parts[2] ?? '';
  const expected = hmac(key, `v1.${body}`);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
  } catch {
    return null;
  }
  if (!payload || payload.scope !== scope || typeof payload.exp !== 'number') return null;
  if (payload.exp * 1000 <= nowMs) return null;
  return payload;
}
