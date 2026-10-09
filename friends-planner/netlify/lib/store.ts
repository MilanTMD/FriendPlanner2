/** Key-value storage with ETag-based optimistic concurrency (Netlify Blobs or in memory). */
import { getStore } from '@netlify/blobs';
import { ApiError, err } from './http';

export interface StoreEntry<T = unknown> {
  data: T;
  etag: string;
}

export interface SetConditions {
  /** Only write if the key does not exist yet. */
  onlyIfNew?: boolean;
  /** Only write if the key exists and its current ETag equals this value. */
  onlyIfMatch?: string;
}

export interface SetResult {
  modified: boolean;
  etag?: string;
}

export interface KeyValueStore {
  getWithMetadata<T = unknown>(key: string): Promise<StoreEntry<T> | null>;
  setJSON(key: string, value: unknown, conditions?: SetConditions): Promise<SetResult>;
  delete(key: string): Promise<void>;
}

/** Store name per deploy context, so previews and branch deploys never touch production data. */
export function storeNameFor(deployContext: string | undefined): string {
  const ctx = (deployContext ?? '').trim() || 'dev';
  return ctx === 'production' ? 'friends-planner' : `friends-planner-${ctx.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

/**
 * Netlify Blobs, site-wide store with strong consistency. The default region is used on purpose.
 *
 * Production Blobs return an ETag on reads. The local sandbox used by `netlify dev` returns ETags on
 * writes and in list() results but not on reads, so there the ETag is taken from list() on both sides of
 * the read; if the two agree, the data we read is the version that ETag names.
 */
export interface LocalBlobsConnection {
  siteID: string;
  token: string;
  /** URL of a local BlobsServer (used by the production preview script). */
  edgeURL: string;
}

export function createBlobsStore(deployContext: string | undefined, local?: LocalBlobsConnection): KeyValueStore {
  const store = getStore({
    name: storeNameFor(deployContext),
    consistency: 'strong',
    ...(local ? { siteID: local.siteID, token: local.token, edgeURL: local.edgeURL, uncachedEdgeURL: local.edgeURL } : {}),
  });

  async function listEtag(key: string): Promise<string> {
    const { blobs } = await store.list({ prefix: key });
    return blobs.find((b) => b.key === key)?.etag ?? '';
  }

  return {
    async getWithMetadata<T>(key: string): Promise<StoreEntry<T> | null> {
      const first = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
      if (!first) return null;
      if (first.etag) return { data: first.data as T, etag: first.etag };
      // Local sandbox: no ETag on reads. Bracket a second read with two list() calls.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const before = await listEtag(key);
        const again = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
        if (!again) return null;
        const after = await listEtag(key);
        if (before === after) return { data: again.data as T, etag: after };
      }
      throw new Error('Blobs read was not stable');
    },
    async setJSON(key, value, conditions) {
      const options =
        conditions?.onlyIfMatch !== undefined
          ? { onlyIfMatch: conditions.onlyIfMatch }
          : conditions?.onlyIfNew
            ? { onlyIfNew: true }
            : {};
      const result = await store.setJSON(key, value, options);
      return result.etag !== undefined ? { modified: result.modified, etag: result.etag } : { modified: result.modified };
    },
    async delete(key) {
      await store.delete(key);
    },
  };
}

/** In-memory store with the same ETag semantics as Blobs. For unit tests. */
export function createMemoryStore(): KeyValueStore & { dump(): Record<string, unknown> } {
  const map = new Map<string, { json: string; etag: string }>();
  let counter = 0;
  return {
    async getWithMetadata<T>(key: string): Promise<StoreEntry<T> | null> {
      const entry = map.get(key);
      if (!entry) return null;
      return { data: JSON.parse(entry.json) as T, etag: entry.etag };
    },
    async setJSON(key, value, conditions) {
      const existing = map.get(key);
      if (conditions?.onlyIfNew && existing) return { modified: false };
      if (conditions?.onlyIfMatch !== undefined && (!existing || existing.etag !== conditions.onlyIfMatch)) {
        return { modified: false };
      }
      counter += 1;
      const etag = `"mem-${counter}"`;
      map.set(key, { json: JSON.stringify(value), etag });
      return { modified: true, etag };
    },
    async delete(key) {
      map.delete(key);
    },
    dump() {
      const out: Record<string, unknown> = {};
      for (const [k, v] of map) out[k] = JSON.parse(v.json);
      return out;
    },
  };
}

export interface UpdateOptions {
  attempts?: number;
  /** Injected so tests do not actually wait. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Read-modify-write with optimistic concurrency.
 * `mutate` receives a fresh copy of the current document and returns `{ next, result }`.
 * It may throw (validation, NAME_TAKEN, not found...) to abort without writing.
 * Up to 5 attempts with jittered backoff, then 409 CONFLICT.
 */
export async function updateJSON<T, R>(
  store: KeyValueStore,
  key: string,
  initial: T,
  mutate: (current: T) => { next: T; result: R },
  options: UpdateOptions = {},
): Promise<R> {
  const attempts = options.attempts ?? 5;
  const sleep = options.sleep ?? defaultSleep;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const entry = await store.getWithMetadata<T>(key);
    let write: SetResult;
    let result: R;
    if (!entry) {
      const out = mutate(structuredClone(initial));
      result = out.result;
      write = await store.setJSON(key, out.next, { onlyIfNew: true });
    } else {
      const out = mutate(entry.data);
      result = out.result;
      write = await store.setJSON(key, out.next, { onlyIfMatch: entry.etag });
    }
    if (write.modified) return result;
    if (attempt < attempts) await sleep(20 + Math.floor(Math.random() * 100));
  }
  throw err.conflict();
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
