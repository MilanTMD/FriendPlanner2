/** People and events documents: read helpers, the public DTO mapper, and cascades. */
import type { EventsDocument, PeopleDocument, Person, PlanEvent, StoredPerson } from '../../shared/types';
import { updateJSON, type KeyValueStore } from './store';

export const PEOPLE_KEY = 'people';
export const EVENTS_KEY = 'events';

export const emptyPeople = (): PeopleDocument => ({ schemaVersion: 1, people: [] });
export const emptyEvents = (): EventsDocument => ({ schemaVersion: 1, events: [] });

/** The ONLY route from a stored person to an API response. Never includes PIN material. */
export function toPersonDTO(stored: StoredPerson): Person {
  return {
    id: stored.id,
    name: stored.name,
    colorId: stored.colorId,
    createdAt: stored.createdAt,
  };
}

export async function readPeople(store: KeyValueStore): Promise<StoredPerson[]> {
  const entry = await store.getWithMetadata<PeopleDocument>(PEOPLE_KEY);
  return entry?.data.people ?? [];
}

export async function readEvents(store: KeyValueStore): Promise<PlanEvent[]> {
  const entry = await store.getWithMetadata<EventsDocument>(EVENTS_KEY);
  return entry?.data.events ?? [];
}

export async function findPerson(store: KeyValueStore, id: string): Promise<StoredPerson | null> {
  const people = await readPeople(store);
  return people.find((p) => p.id === id) ?? null;
}

const nameCollator = new Intl.Collator('en', { sensitivity: 'base' });

export function sortPeople<T extends Person>(people: readonly T[]): T[] {
  return [...people].sort((a, b) => nameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id));
}

/** startDate ascending, then endDate descending, then id. */
export function sortEvents(events: readonly PlanEvent[]): PlanEvent[] {
  return [...events].sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
    if (a.endDate !== b.endDate) return a.endDate < b.endDate ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Removes a person's events (first), then the person. Two writes: an orphan person can simply be deleted again. */
export async function deletePersonCascade(store: KeyValueStore, personId: string): Promise<number> {
  const removed = await updateJSON<EventsDocument, number>(store, EVENTS_KEY, emptyEvents(), (doc) => {
    const kept = doc.events.filter((e) => e.personId !== personId);
    return { next: { ...doc, events: kept }, result: doc.events.length - kept.length };
  });
  await updateJSON<PeopleDocument, null>(store, PEOPLE_KEY, emptyPeople(), (doc) => ({
    next: { ...doc, people: doc.people.filter((p) => p.id !== personId) },
    result: null,
  }));
  return removed;
}
