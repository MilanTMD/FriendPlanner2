/**
 * Local production preview: serves the built `dist/` plus the real API code on its own port, so it can
 * run next to `netlify dev` (port 8888). Use it for Lighthouse and other production-build checks.
 *
 *   npm run serve:prod                  -> http://localhost:8889
 *   npm run serve:prod -- --port 9000   -> http://localhost:9000
 *
 * Why not `netlify serve`? It shares `.netlify/functions-serve` with `netlify dev`, so running both at the
 * same time breaks the dev server's function (and `netlify serve` cannot serve nested static files on
 * Windows). This script mirrors what Netlify does in production:
 *  - /api/* goes to the same `handleApiRequest` code as the Netlify Function, backed by a local Blobs server
 *    (real ETag and conditional-write semantics) stored in `.netlify/preview-blobs/`;
 *  - everything else is a static file from `dist/`, falling back to `/index.html` with status 200 (the SPA rule
 *    in netlify.toml);
 *  - the security headers from netlify.toml are added, hashed `static-*` files get immutable caching, and
 *    text responses are compressed like Netlify's CDN does. The CSP is the <meta> tag in index.html.
 * LOCAL ONLY. Run `npm run build` first (the npm script does).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { BlobsServer } from '@netlify/blobs/server';
import { handleApiRequest } from '../netlify/lib/router';
import { createBlobsStore } from '../netlify/lib/store';

if (existsSync('.env')) process.loadEnvFile('.env');

function portFromArgs(): number {
  const idx = process.argv.indexOf('--port');
  const raw = idx >= 0 ? process.argv[idx + 1] : process.env.PORT;
  const port = raw ? Number(raw) : 8889;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`Invalid port "${raw}".`);
    process.exit(1);
  }
  return port;
}

const PORT = portFromArgs();
const DIST = resolve('dist');
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

// Mirrors the [[headers]] block for "/*" in netlify.toml.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.txt', '.json']);

const compressed = new Map<string, Buffer>();

function resolveStatic(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const candidate = resolve(DIST, `.${normalize(decoded)}`);
  if (candidate !== DIST && !candidate.startsWith(DIST + sep)) return null;
  try {
    if (statSync(candidate).isFile()) return candidate;
  } catch {
    /* not a file */
  }
  return null;
}

function sendFile(req: IncomingMessage, res: ServerResponse, file: string): void {
  const ext = extname(file);
  const headers: Record<string, string | number> = {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    // Netlify default for static files; hashed bundles are immutable (netlify.toml: for "/static-*").
    'Cache-Control': /^static-/.test(file.split(sep).pop() ?? '')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
    Vary: 'Accept-Encoding',
  };
  let body: Uint8Array = readFileSync(file);
  if (COMPRESSIBLE.has(ext)) {
    const accept = String(req.headers['accept-encoding'] ?? '');
    const encoding = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
    if (encoding) {
      const key = `${file}|${encoding}|${statSync(file).mtimeMs}`;
      let packed = compressed.get(key);
      if (!packed) {
        packed =
          encoding === 'br'
            ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } })
            : gzipSync(body, { level: 9 });
        compressed.set(key, packed);
      }
      body = packed;
      headers['Content-Encoding'] = encoding;
    }
  }
  headers['Content-Length'] = body.length;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks);
}

async function main(): Promise<void> {
  const token = 'preview-token';
  const siteID = 'preview';
  const blobs = new BlobsServer({ directory: resolve('.netlify', 'preview-blobs'), token });
  const { port: blobsPort } = await blobs.start();
  const deployContext = process.env.CONTEXT || 'dev';
  const store = createBlobsStore(deployContext, { siteID, token, edgeURL: `http://127.0.0.1:${blobsPort}` });

  const server = createServer((req, res) => {
    void (async () => {
      try {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${PORT}`}`);
        if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(', '));
          }
          const request = new Request(url, { method: req.method ?? 'GET', headers, ...(body ? { body } : {}) });
          const response = await handleApiRequest(request, {
            store,
            env: { ...process.env, CONTEXT: deployContext },
            ip: req.socket.remoteAddress ?? '127.0.0.1',
            now: () => Date.now(),
          });
          const out: Record<string, string | string[]> = { ...SECURITY_HEADERS };
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') out[key] = value;
          });
          const cookies = response.headers.getSetCookie();
          if (cookies.length > 0) out['set-cookie'] = cookies;
          res.writeHead(response.status, out);
          res.end(Buffer.from(await response.arrayBuffer()));
          return;
        }
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405, SECURITY_HEADERS);
          res.end('Method Not Allowed');
          return;
        }
        const file = resolveStatic(url.pathname) ?? join(DIST, 'index.html');
        sendFile(req, res, file);
      } catch (error) {
        console.error('[preview] error:', error instanceof Error ? error.message : error);
        if (!res.headersSent) res.writeHead(500, SECURITY_HEADERS);
        res.end('Internal Server Error');
      }
    })();
  });

  server.listen(PORT, () => {
    console.log(`\nProduction preview: http://localhost:${PORT}  (dist/ + /api, context "${deployContext}")`);
    console.log(`Seed it with: npm run seed -- --base-url http://localhost:${PORT}`);
    console.log('Stop with Ctrl+C.');
  });
  const shutdown = () => {
    server.close();
    void blobs.stop().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
