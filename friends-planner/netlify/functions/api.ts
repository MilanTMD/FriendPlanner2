import { createHash } from 'node:crypto';
import type { Config, Context } from '@netlify/functions';
import { handleApiRequest } from '../lib/router';
import { createBlobsStore, type KeyValueStore } from '../lib/store';

/**
 * `netlify dev` (CLI 27) re-sends every 403/404 response from a function to the function again with
 * ".html", ".htm", "/index.html" and "/index.htm" appended to the path (it looks for a static file), and
 * the client receives the LAST attempt. That would turn a 403 PIN_INVALID into a 404, and each retry
 * would re-run side effects (such as counting another wrong PIN). Production Netlify does not do this.
 *
 * In dev only, the first 403/404 response is remembered for a few seconds and replayed for those retries
 * without running the handler again.
 */
const CLI_RETRY_SUFFIX = /(?:\/index)?\.html?$/i;
const REPLAY_TTL_MS = 15_000;

interface ReplayEntry {
  status: number;
  body: string;
  headers: [string, string][];
  storedAt: number;
}

async function replayKey(req: Request, pathname: string, search: string): Promise<string> {
  const body = await req.clone().text();
  const material = [req.method, pathname, search, req.headers.get('cookie') ?? '', body].join('\n');
  return `devreplay/${createHash('sha256').update(material).digest('hex').slice(0, 40)}`;
}

async function handleInDev(req: Request, store: KeyValueStore, respond: () => Promise<Response>): Promise<Response> {
  const url = new URL(req.url);
  const original = url.pathname.replace(CLI_RETRY_SUFFIX, '');
  const isRetry = original !== url.pathname;
  const key = await replayKey(req, original, url.search);

  if (isRetry) {
    const entry = await store.getWithMetadata<ReplayEntry>(key);
    if (entry && Date.now() - entry.data.storedAt < REPLAY_TTL_MS) {
      return new Response(entry.data.body, { status: entry.data.status, headers: entry.data.headers });
    }
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const response = await respond();
  if (response.status === 403 || response.status === 404) {
    const body = await response.clone().text();
    const entry: ReplayEntry = {
      status: response.status,
      body,
      headers: [...response.headers.entries()],
      storedAt: Date.now(),
    };
    await store.setJSON(key, entry);
  }
  return response;
}

export default async (req: Request, context: Context): Promise<Response> => {
  const deployContext = context.deploy?.context || process.env.CONTEXT || 'dev';
  const store = createBlobsStore(deployContext);
  const respond = () =>
    handleApiRequest(req, {
      store,
      env: { ...process.env, CONTEXT: deployContext },
      ip: context.ip,
      now: () => Date.now(),
    });
  if (process.env.NETLIFY_DEV === 'true') return handleInDev(req, store, respond);
  return respond();
};

export const config: Config = { path: '/api/*' };
