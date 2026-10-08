import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CreateEventBody, CreatePersonBody, EventInput, Person, PlanEvent, UpdatePersonBody } from '../../shared/types';
import { ApiError, api } from '../api/client';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface DataValue {
  people: Person[];
  events: PlanEvent[];
  peopleById: ReadonlyMap<string, Person>;
  status: Status;
  error: ApiError | null;
  refetch: () => Promise<void>;
  /** Event id whose bars are briefly highlighted after a save. */
  highlightId: string | null;
  createEvent: (body: CreateEventBody) => Promise<PlanEvent>;
  updateEvent: (id: string, body: EventInput) => Promise<PlanEvent>;
  deleteEvent: (id: string) => Promise<void>;
  createPerson: (body: CreatePersonBody) => Promise<Person>;
  updatePerson: (id: string, body: UpdatePersonBody) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
  resetPin: (id: string, newPin: string) => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

const REFETCH_ON_VISIBLE_MS = 30_000;
const HIGHLIGHT_MS = 1600;

export function DataProvider({ children }: { children: ReactNode }) {
  // Mounted only while a group session exists, so logging out unmounts it and drops all cached data.
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<PlanEvent[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const lastFetch = useRef(0);

  const applyResult = useCallback((p: { people: Person[] }, e: { events: PlanEvent[] }) => {
    setPeople(p.people);
    setEvents(e.events);
    lastFetch.current = Date.now();
    setError(null);
    setStatus('ready');
  }, []);

  const applyError = useCallback((caught: unknown) => {
    setError(caught instanceof ApiError ? caught : new ApiError(0, 'NETWORK', "Couldn't reach the server. Check your connection."));
    setStatus('error');
  }, []);

  const refetch = useCallback(async () => {
    try {
      const [p, e] = await Promise.all([api.listPeople(), api.listEvents()]);
      applyResult(p, e);
    } catch (caught) {
      applyError(caught);
    }
  }, [applyResult, applyError]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listPeople(), api.listEvents()])
      .then(([p, e]) => {
        if (!cancelled) applyResult(p, e);
      })
      .catch((caught: unknown) => {
        if (!cancelled) applyError(caught);
      });
    return () => {
      cancelled = true;
    };
  }, [applyResult, applyError]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetch.current > REFETCH_ON_VISIBLE_MS) {
        void refetch();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetch]);

  const highlight = useCallback((id: string) => {
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), HIGHLIGHT_MS);
  }, []);

  const createEvent = useCallback(
    async (body: CreateEventBody) => {
      const { event } = await api.createEvent(body);
      await refetch();
      highlight(event.id);
      return event;
    },
    [refetch, highlight],
  );
  const updateEvent = useCallback(
    async (id: string, body: EventInput) => {
      const { event } = await api.updateEvent(id, body);
      await refetch();
      highlight(event.id);
      return event;
    },
    [refetch, highlight],
  );
  const deleteEvent = useCallback(
    async (id: string) => {
      await api.deleteEvent(id);
      await refetch();
    },
    [refetch],
  );
  const createPerson = useCallback(
    async (body: CreatePersonBody) => {
      const { person } = await api.createPerson(body);
      await refetch();
      return person;
    },
    [refetch],
  );
  const updatePerson = useCallback(
    async (id: string, body: UpdatePersonBody) => {
      const { person } = await api.updatePerson(id, body);
      await refetch();
      return person;
    },
    [refetch],
  );
  const deletePerson = useCallback(
    async (id: string) => {
      await api.deletePerson(id);
      await refetch();
    },
    [refetch],
  );
  const resetPin = useCallback(async (id: string, newPin: string) => {
    await api.resetPin(id, newPin);
  }, []);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const value = useMemo<DataValue>(
    () => ({
      people,
      events,
      peopleById,
      status,
      error,
      refetch,
      highlightId,
      createEvent,
      updateEvent,
      deleteEvent,
      createPerson,
      updatePerson,
      deletePerson,
      resetPin,
    }),
    [people, events, peopleById, status, error, refetch, highlightId, createEvent, updateEvent, deleteEvent, createPerson, updatePerson, deletePerson, resetPin],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
