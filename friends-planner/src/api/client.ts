import type {
  ApiErrorBody,
  CreateEventBody,
  CreatePersonBody,
  ErrorCode,
  EventInput,
  PlanEvent,
  Person,
  SessionInfo,
  UpdatePersonBody,
} from '../../shared/types';

export type ClientErrorCode = ErrorCode | 'NETWORK';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ClientErrorCode;
  readonly fields: Record<string, string>;
  readonly remainingAttempts: number | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, code: ClientErrorCode, message: string, extra: Partial<ApiErrorBody['error']> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = extra.fields ?? {};
    this.remainingAttempts = extra.remainingAttempts;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }

  /** True when this error represents an active lock-out. */
  get isLocked(): boolean {
    return this.code === 'LOCKED' || (this.retryAfterSeconds !== undefined && this.retryAfterSeconds > 0);
  }
}

type UnauthenticatedHandler = () => void;
let onUnauthenticated: UnauthenticatedHandler | null = null;

export function setUnauthenticatedHandler(handler: UnauthenticatedHandler | null): void {
  onUnauthenticated = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', "Couldn't reach the server. Check your connection.");
  }
  if (response.status === 204) return undefined as T;
  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const e = (data as ApiErrorBody | null)?.error;
    const error = new ApiError(
      response.status,
      (e?.code as ClientErrorCode | undefined) ?? 'INTERNAL',
      e?.message ?? 'Something went wrong.',
      e ?? {},
    );
    if (error.code === 'UNAUTHENTICATED' && onUnauthenticated) onUnauthenticated();
    throw error;
  }
  return data as T;
}

export const api = {
  getSession: () => request<SessionInfo>('GET', '/session'),
  login: (passcode: string) => request<SessionInfo>('POST', '/session', { passcode }),
  logout: () => request<void>('DELETE', '/session'),
  forgetPerson: () => request<void>('DELETE', '/session/person'),

  listPeople: () => request<{ people: Person[] }>('GET', '/people'),
  createPerson: (body: CreatePersonBody) => request<{ person: Person }>('POST', '/people', body),
  updatePerson: (id: string, body: UpdatePersonBody) => request<{ person: Person }>('PATCH', `/people/${id}`, body),
  deletePerson: (id: string) => request<void>('DELETE', `/people/${id}`),
  verifyPin: (id: string, pin: string, remember: boolean) =>
    request<{ person: Person }>('POST', `/people/${id}/verify-pin`, { pin, remember }),
  resetPin: (id: string, newPin: string) => request<void>('POST', `/people/${id}/reset-pin`, { newPin }),

  listEvents: () => request<{ events: PlanEvent[] }>('GET', '/events'),
  createEvent: (body: CreateEventBody) => request<{ event: PlanEvent }>('POST', '/events', body),
  updateEvent: (id: string, body: EventInput) => request<{ event: PlanEvent }>('PUT', `/events/${id}`, body),
  deleteEvent: (id: string) => request<void>('DELETE', `/events/${id}`),

  adminLogin: (passcode: string) => request<{ admin: true }>('POST', '/admin/session', { passcode }),
  adminLogout: () => request<void>('DELETE', '/admin/session'),
};
