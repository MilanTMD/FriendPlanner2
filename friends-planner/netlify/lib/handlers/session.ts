import type { PeopleDocument, SessionInfo } from '../../../shared/types';
import { canActFor, clearAdminCookie, clearGroupCookie, clearPersonCookie, groupCookie, requireGroup } from '../auth';
import type { Handler, RequestContext } from '../context';
import { ipHash, passcodeEquals } from '../crypto';
import { ApiError, json, noContent, readJsonBody } from '../http';
import { PEOPLE_KEY, toPersonDTO } from '../repo';
import { GROUP_POLICY, assertNotLocked, groupKey, recordFailure, recordSuccess } from '../throttle';

export async function buildSessionInfo(ctx: RequestContext, groupOverride = false): Promise<SessionInfo> {
  const authenticated = groupOverride || ctx.sessions.group;
  if (!authenticated) return { authenticated: false, admin: false, person: null };
  let person: SessionInfo['person'] = null;
  if (ctx.sessions.person?.pid) {
    const entry = await ctx.deps.store.getWithMetadata<PeopleDocument>(PEOPLE_KEY);
    const stored = entry?.data.people.find((p) => p.id === ctx.sessions.person?.pid);
    if (stored && canActFor({ ...ctx.sessions, admin: false }, stored)) person = toPersonDTO(stored);
  }
  return { authenticated: true, admin: ctx.sessions.admin, person };
}

export const getSession: Handler = async (ctx) => json(await buildSessionInfo(ctx));

export const postSession: Handler = async (ctx) => {
  const body = await readJsonBody(ctx.req);
  const passcode = typeof body.passcode === 'string' ? body.passcode : '';
  const key = groupKey(ipHash(ctx.config.sessionSecret, ctx.deps.ip));
  const now = ctx.deps.now();
  await assertNotLocked(ctx.deps.store, key, now);

  if (!passcodeEquals(passcode, ctx.config.groupPasscode)) {
    const outcome = await recordFailure(ctx.deps.store, key, GROUP_POLICY, now);
    throw new ApiError(401, 'PASSCODE_INVALID', "That passcode didn't work. Check with the group and try again.", {
      remainingAttempts: outcome.remainingAttempts,
      ...(outcome.locked ? { retryAfterSeconds: outcome.retryAfterSeconds } : {}),
    });
  }
  await recordSuccess(ctx.deps.store, key);
  const headers = new Headers();
  headers.append('Set-Cookie', groupCookie(ctx.req, ctx.keys, now));
  return json(await buildSessionInfo(ctx, true), 200, headers);
};

export const deleteSession: Handler = async (ctx) => {
  const headers = new Headers();
  headers.append('Set-Cookie', clearGroupCookie(ctx.req));
  headers.append('Set-Cookie', clearPersonCookie(ctx.req));
  headers.append('Set-Cookie', clearAdminCookie(ctx.req));
  return noContent(headers);
};

export const deleteSessionPerson: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const headers = new Headers();
  headers.append('Set-Cookie', clearPersonCookie(ctx.req));
  return noContent(headers);
};
