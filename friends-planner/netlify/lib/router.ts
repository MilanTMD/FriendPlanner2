/** Method + path dispatch, auth context, error mapping. Framework-agnostic: Request in, Response out. */
import { readSessions } from './auth';
import { loadConfig } from './config';
import type { Deps, Handler, RequestContext } from './context';
import { deriveKeys } from './crypto';
import { ApiError, errorResponse, json } from './http';
import { deleteAdminSession, exportData, postAdminSession } from './handlers/admin';
import { createEvent, deleteEvent, listEvents, updateEvent } from './handlers/events';
import { health } from './handlers/health';
import {
  createPerson,
  deletePerson,
  listPeople,
  patchPerson,
  resetPin,
  verifyPersonPin,
} from './handlers/people';
import { deleteSession, deleteSessionPerson, getSession, postSession } from './handlers/session';

export type { Deps } from './context';

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

function route(method: string, path: string, handler: Handler): Route {
  const keys: string[] = [];
  const source = path.replace(/:([a-zA-Z]+)/g, (_m, name: string) => {
    keys.push(name);
    return '([^/]+)';
  });
  return { method, pattern: new RegExp(`^${source}/?$`), keys, handler };
}

const ROUTES: Route[] = [
  route('GET', '/session', getSession),
  route('POST', '/session', postSession),
  route('DELETE', '/session', deleteSession),
  route('DELETE', '/session/person', deleteSessionPerson),
  route('GET', '/people', listPeople),
  route('POST', '/people', createPerson),
  route('PATCH', '/people/:id', patchPerson),
  route('DELETE', '/people/:id', deletePerson),
  route('POST', '/people/:id/verify-pin', verifyPersonPin),
  route('POST', '/people/:id/reset-pin', resetPin),
  route('GET', '/events', listEvents),
  route('POST', '/events', createEvent),
  route('PUT', '/events/:id', updateEvent),
  route('DELETE', '/events/:id', deleteEvent),
  route('POST', '/admin/session', postAdminSession),
  route('DELETE', '/admin/session', deleteAdminSession),
  route('GET', '/admin/export', exportData),
];

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** SHOULD-level CSRF defence: reject mutations whose Origin host differs from the request host. */
function originAllowed(req: Request, url: URL): boolean {
  const origin = req.headers.get('origin');
  if (!origin || origin === 'null') return !origin;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>([url.host]);
  const host = req.headers.get('host');
  if (host) allowed.add(host);
  const forwarded = req.headers.get('x-forwarded-host');
  if (forwarded) for (const h of forwarded.split(',')) allowed.add(h.trim());
  return allowed.has(originHost);
}

function apiPath(pathname: string): string | null {
  if (pathname === '/api') return '/';
  if (!pathname.startsWith('/api/')) return null;
  return pathname.slice(4) || '/';
}

export async function handleApiRequest(req: Request, deps: Deps): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = apiPath(url.pathname);
    if (path === null) throw new ApiError(404, 'NOT_FOUND', 'Not found.');

    if (path === '/health' || path === '/health/') {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
      }
      return health();
    }

    const config = loadConfig(deps.env);

    let matched: { route: Route; params: Record<string, string> } | null = null;
    let pathMatched = false;
    for (const r of ROUTES) {
      const m = r.pattern.exec(path);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== req.method) continue;
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => {
        params[k] = decodeURIComponent(m[i + 1] ?? '');
      });
      matched = { route: r, params };
      break;
    }
    if (!matched) {
      if (pathMatched) throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
      throw new ApiError(404, 'NOT_FOUND', 'Not found.');
    }

    if (MUTATING.has(req.method) && !originAllowed(req, url)) {
      throw new ApiError(403, 'FORBIDDEN', 'Cross-origin requests are not allowed.');
    }

    const keys = deriveKeys(config);
    const sessions = readSessions(req, keys, deps.now());
    const ctx: RequestContext = { req, url, params: matched.params, deps, config, keys, sessions };
    return await matched.route.handler(ctx);
  } catch (e) {
    if (e instanceof ApiError) return errorResponse(e);
    // Never log bodies, cookies, PINs or passcodes: only the error name/message.
    console.error('[api] unexpected error:', e instanceof Error ? e.name : 'unknown');
    return json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side.' } }, 500);
  }
}
