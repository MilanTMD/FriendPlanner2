import { adminCookie, clearAdminCookie, requireAdmin, requireGroup } from '../auth';
import type { Handler } from '../context';
import { ipHash, passcodeEquals } from '../crypto';
import { ApiError, json, noContent, readJsonBody } from '../http';
import { readEvents, readPeople, sortEvents, sortPeople, toPersonDTO } from '../repo';
import { ADMIN_POLICY, adminKey, assertNotLocked, recordFailure, recordSuccess } from '../throttle';

export const postAdminSession: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const body = await readJsonBody(ctx.req);
  const passcode = typeof body.passcode === 'string' ? body.passcode : '';
  const key = adminKey(ipHash(ctx.config.sessionSecret, ctx.deps.ip));
  const now = ctx.deps.now();
  await assertNotLocked(ctx.deps.store, key, now);

  if (!passcodeEquals(passcode, ctx.config.adminPasscode)) {
    const outcome = await recordFailure(ctx.deps.store, key, ADMIN_POLICY, now);
    throw new ApiError(401, 'PASSCODE_INVALID', "That passcode didn't work.", {
      remainingAttempts: outcome.remainingAttempts,
      ...(outcome.locked ? { retryAfterSeconds: outcome.retryAfterSeconds } : {}),
    });
  }
  await recordSuccess(ctx.deps.store, key);
  const headers = new Headers();
  headers.append('Set-Cookie', adminCookie(ctx.req, ctx.keys, now));
  return json({ admin: true }, 200, headers);
};

export const deleteAdminSession: Handler = async (ctx) => {
  const headers = new Headers();
  headers.append('Set-Cookie', clearAdminCookie(ctx.req));
  return noContent(headers);
};

export const exportData: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  requireAdmin(ctx.sessions);
  const [people, events] = await Promise.all([readPeople(ctx.deps.store), readEvents(ctx.deps.store)]);
  const headers = new Headers({ 'Content-Disposition': 'attachment; filename="friends-plans-backup.json"' });
  return json({ people: sortPeople(people.map(toPersonDTO)), events: sortEvents(events) }, 200, headers);
};
