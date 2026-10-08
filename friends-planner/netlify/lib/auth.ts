/** Session reading and the server-side permission rules (BRIEF section 5.7). */
import type { StoredPerson } from '../../shared/types';
import type { ScopeKeys, TokenPayload } from './crypto';
import { pinFingerprint, signToken, verifyToken } from './crypto';
import {
  COOKIE_NAMES,
  COOKIE_SAMESITE,
  clearedCookie,
  err,
  isHttps,
  parseCookies,
  serializeCookie,
} from './http';

export const GROUP_SESSION_SECONDS = 180 * 24 * 3600;
export const PERSON_REMEMBER_SECONDS = 90 * 24 * 3600;
export const PERSON_SESSION_SECONDS = 12 * 3600;
export const ADMIN_SESSION_SECONDS = 12 * 3600;

export interface Sessions {
  group: boolean;
  admin: boolean;
  /** Verified token payload for the person cookie (the PIN fingerprint is checked in canActFor). */
  person: TokenPayload | null;
}

export function readSessions(req: Request, keys: ScopeKeys, nowMs: number): Sessions {
  const cookies = parseCookies(req.headers.get('cookie'));
  const group = verifyToken(cookies[COOKIE_NAMES.group], keys.group, 'group', nowMs) !== null;
  const admin = group && verifyToken(cookies[COOKIE_NAMES.admin], keys.admin, 'admin', nowMs) !== null;
  const person = verifyToken(cookies[COOKIE_NAMES.person], keys.person, 'person', nowMs);
  return { group, admin, person };
}

export function requireGroup(sessions: Sessions): void {
  if (!sessions.group) throw err.unauthenticated();
}

export function requireAdmin(sessions: Sessions): void {
  if (!sessions.admin) throw err.forbidden();
}

/** True for an admin session, or a person session for exactly this person whose PIN has not changed since. */
export function canActFor(sessions: Sessions, person: StoredPerson | null | undefined): boolean {
  if (sessions.admin) return true;
  if (!person || !sessions.person) return false;
  return sessions.person.pid === person.id && sessions.person.pfp === pinFingerprint(person.pinHash);
}

/** Throws 403 PIN_REQUIRED unless the caller may act for this person. */
export function requireCanActFor(sessions: Sessions, person: StoredPerson | null | undefined): void {
  if (!canActFor(sessions, person)) throw err.pinRequired();
}

/* ---------- cookie builders ---------- */

export function groupCookie(req: Request, keys: ScopeKeys, nowMs: number): string {
  const iat = Math.floor(nowMs / 1000);
  const token = signToken({ scope: 'group', iat, exp: iat + GROUP_SESSION_SECONDS }, keys.group);
  return serializeCookie(COOKIE_NAMES.group, token, {
    maxAge: GROUP_SESSION_SECONDS,
    sameSite: COOKIE_SAMESITE.group,
    secure: isHttps(req),
  });
}

export function adminCookie(req: Request, keys: ScopeKeys, nowMs: number): string {
  const iat = Math.floor(nowMs / 1000);
  const token = signToken({ scope: 'admin', iat, exp: iat + ADMIN_SESSION_SECONDS }, keys.admin);
  return serializeCookie(COOKIE_NAMES.admin, token, {
    maxAge: ADMIN_SESSION_SECONDS,
    sameSite: COOKIE_SAMESITE.admin,
    secure: isHttps(req),
  });
}

export function personCookie(
  req: Request,
  keys: ScopeKeys,
  person: StoredPerson,
  remember: boolean,
  nowMs: number,
): string {
  const iat = Math.floor(nowMs / 1000);
  const ttl = remember ? PERSON_REMEMBER_SECONDS : PERSON_SESSION_SECONDS;
  const token = signToken(
    { scope: 'person', pid: person.id, pfp: pinFingerprint(person.pinHash), iat, exp: iat + ttl },
    keys.person,
  );
  return serializeCookie(COOKIE_NAMES.person, token, {
    ...(remember ? { maxAge: PERSON_REMEMBER_SECONDS } : {}),
    sameSite: COOKIE_SAMESITE.person,
    secure: isHttps(req),
  });
}

export function clearGroupCookie(req: Request): string {
  return clearedCookie(COOKIE_NAMES.group, COOKIE_SAMESITE.group, isHttps(req));
}
export function clearPersonCookie(req: Request): string {
  return clearedCookie(COOKIE_NAMES.person, COOKIE_SAMESITE.person, isHttps(req));
}
export function clearAdminCookie(req: Request): string {
  return clearedCookie(COOKIE_NAMES.admin, COOKIE_SAMESITE.admin, isHttps(req));
}
