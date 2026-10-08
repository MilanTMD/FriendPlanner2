/** Shared data model and API contract (used by src/, netlify/ and scripts/). */

/** 'YYYY-MM-DD' calendar date, never a timestamp. */
export type ISODate = string;
/** 'YYYY-MM' month key. */
export type MonthKey = string;

export type PersonColorId =
  | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6'
  | 'c7' | 'c8' | 'c9' | 'c10' | 'c11' | 'c12';

/** Public DTO: the ONLY person shape the API returns. */
export interface Person {
  id: string;
  name: string;
  colorId: PersonColorId;
  /** ISO instant; audit metadata only. */
  createdAt: string;
}

/** Server-only. Never serialized to clients. */
export interface StoredPerson extends Person {
  /** 'scrypt$16384$8$1$<saltB64url>$<hashB64url>' */
  pinHash: string;
  /** ISO instant. */
  pinChangedAt: string;
}

export interface PlanEvent {
  id: string;
  /** Owner; immutable after creation. */
  personId: string;
  title: string;
  place: string;
  /** Inclusive. */
  startDate: ISODate;
  /** Inclusive (single-day: endDate === startDate). */
  endDate: ISODate;
  /** '' when empty. */
  notes: string;
  /** ISO instant; audit metadata only. */
  createdAt: string;
  /** ISO instant; audit metadata only. */
  updatedAt: string;
}

export interface PeopleDocument {
  schemaVersion: 1;
  people: StoredPerson[];
}

export interface EventsDocument {
  schemaVersion: 1;
  events: PlanEvent[];
}

export interface ThrottleState {
  failures: number;
  lockLevel: number;
  /** epoch ms */
  lockedUntil: number;
  /** epoch ms */
  updatedAt: number;
}

/* ---------- API contract ---------- */

export type ErrorCode =
  | 'VALIDATION'
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'PASSCODE_INVALID'
  | 'PIN_REQUIRED'
  | 'PIN_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'NAME_TAKEN'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'LOCKED'
  | 'MISCONFIGURED'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
    remainingAttempts?: number;
    retryAfterSeconds?: number;
  };
}

export interface SessionInfo {
  authenticated: boolean;
  admin: boolean;
  person: Person | null;
}

export interface EventInput {
  title: string;
  place: string;
  startDate: ISODate;
  endDate: ISODate;
  notes: string;
}

export interface CreateEventBody extends EventInput {
  personId: string;
}

export interface CreatePersonBody {
  name: string;
  colorId: PersonColorId;
  pin: string;
  remember: boolean;
}

export interface UpdatePersonBody {
  name?: string;
  colorId?: PersonColorId;
}
