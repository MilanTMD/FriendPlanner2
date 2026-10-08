import type { AppConfig } from './config';
import type { Sessions } from './auth';
import type { ScopeKeys } from './crypto';
import type { KeyValueStore } from './store';

export interface Deps {
  store: KeyValueStore;
  env: Record<string, string | undefined>;
  ip: string;
  /** epoch milliseconds */
  now: () => number;
}

export interface RequestContext {
  req: Request;
  url: URL;
  params: Record<string, string>;
  deps: Deps;
  config: AppConfig;
  keys: ScopeKeys;
  sessions: Sessions;
}

export type Handler = (ctx: RequestContext) => Promise<Response>;
