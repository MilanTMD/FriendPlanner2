/**
 * Brute-force throttling. Pure state transitions (injected clock) plus Blobs-backed helpers.
 *
 * Policy: after `threshold` consecutive failures the key locks for 15 min. Any failure after a lock
 * expires (with no success in between) locks again with doubled duration (15 min, 30 min, 1 h, ...
 * capped at 24 h). A success resets the key.
 */
import type { ThrottleState } from '../../shared/types';
import { ApiError } from './http';
import { updateJSON, type KeyValueStore } from './store';

export interface ThrottlePolicy {
  threshold: number;
  baseLockMs: number;
  maxLockMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const PIN_POLICY: ThrottlePolicy = { threshold: 5, baseLockMs: 15 * MINUTE, maxLockMs: 24 * HOUR };
export const GROUP_POLICY: ThrottlePolicy = { threshold: 10, baseLockMs: 15 * MINUTE, maxLockMs: 24 * HOUR };
export const ADMIN_POLICY: ThrottlePolicy = { threshold: 5, baseLockMs: 15 * MINUTE, maxLockMs: 24 * HOUR };

export const initialThrottleState = (): ThrottleState => ({ failures: 0, lockLevel: 0, lockedUntil: 0, updatedAt: 0 });

export interface LockStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

/** Whole seconds until the lock ends (rounded up). */
export function checkLock(state: ThrottleState | null, now: number): LockStatus {
  if (!state || state.lockedUntil <= now) return { locked: false, retryAfterSeconds: 0 };
  return { locked: true, retryAfterSeconds: Math.ceil((state.lockedUntil - now) / 1000) };
}

export function lockDurationMs(lockLevel: number, policy: ThrottlePolicy): number {
  return Math.min(policy.baseLockMs * 2 ** lockLevel, policy.maxLockMs);
}

export interface FailureOutcome {
  state: ThrottleState;
  /** Attempts left before the next lock (0 once locked). */
  remainingAttempts: number;
  locked: boolean;
  retryAfterSeconds: number;
}

export function recordFailureState(state: ThrottleState | null, now: number, policy: ThrottlePolicy): FailureOutcome {
  const current = state ?? initialThrottleState();
  const failures = current.failures + 1;
  let { lockLevel, lockedUntil } = current;
  let locked = false;
  if (failures >= policy.threshold) {
    lockedUntil = now + lockDurationMs(lockLevel, policy);
    lockLevel += 1;
    locked = true;
  }
  const next: ThrottleState = { failures, lockLevel, lockedUntil, updatedAt: now };
  return {
    state: next,
    remainingAttempts: Math.max(0, policy.threshold - failures),
    locked,
    retryAfterSeconds: locked ? Math.ceil((lockedUntil - now) / 1000) : 0,
  };
}

/* ---------- store-backed ---------- */

export const pinKey = (personId: string): string => `throttle/pin/${personId}`;
export const groupKey = (ipHash: string): string => `throttle/group/${ipHash}`;
export const adminKey = (ipHash: string): string => `throttle/admin/${ipHash}`;

export async function readThrottle(store: KeyValueStore, key: string): Promise<ThrottleState | null> {
  const entry = await store.getWithMetadata<ThrottleState>(key);
  return entry ? entry.data : null;
}

/** Throws 429 LOCKED when the key is currently locked. Call BEFORE evaluating the secret. */
export async function assertNotLocked(store: KeyValueStore, key: string, now: number, suffix = '.'): Promise<void> {
  const state = await readThrottle(store, key);
  const lock = checkLock(state, now);
  if (lock.locked) throw lockedError(lock.retryAfterSeconds, suffix);
}

export function lockedError(retryAfterSeconds: number, suffix = '.'): ApiError {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return new ApiError(429, 'LOCKED', `Too many tries. Try again in ${minutes} min${suffix}`, { retryAfterSeconds });
}

export async function recordFailure(
  store: KeyValueStore,
  key: string,
  policy: ThrottlePolicy,
  now: number,
): Promise<FailureOutcome> {
  return updateJSON<ThrottleState, FailureOutcome>(store, key, initialThrottleState(), (current) => {
    const outcome = recordFailureState(current, now, policy);
    return { next: outcome.state, result: outcome };
  });
}

export async function recordSuccess(store: KeyValueStore, key: string): Promise<void> {
  const existing = await store.getWithMetadata(key);
  if (existing) await store.delete(key);
}

export async function clearThrottle(store: KeyValueStore, key: string): Promise<void> {
  await store.delete(key);
}
