import { randomUUID } from 'node:crypto';
import { isValidISODate, overlaps } from '../../../shared/dates';
import type { EventsDocument, PlanEvent } from '../../../shared/types';
import { LIMITS, validateEventInput } from '../../../shared/validation';
import { requireCanActFor, requireGroup } from '../auth';
import type { Handler } from '../context';
import { err, json, noContent, readJsonBody } from '../http';
import { EVENTS_KEY, emptyEvents, findPerson, readEvents, sortEvents } from '../repo';
import { updateJSON } from '../store';

export const listEvents: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const from = ctx.url.searchParams.get('from');
  const to = ctx.url.searchParams.get('to');
  const fields: Record<string, string> = {};
  if (from !== null && !isValidISODate(from)) fields.from = 'Use a valid date (YYYY-MM-DD).';
  if (to !== null && !isValidISODate(to)) fields.to = 'Use a valid date (YYYY-MM-DD).';
  if (Object.keys(fields).length > 0) throw err.validation(fields);

  let events = await readEvents(ctx.deps.store);
  if (from !== null || to !== null) {
    const lo = from ?? '0000-01-01';
    const hi = to ?? '9999-12-31';
    events = events.filter((e) => overlaps(e.startDate, e.endDate, lo, hi));
  }
  return json({ events: sortEvents(events) });
};

export const createEvent: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const body = await readJsonBody(ctx.req);
  const personId = typeof body.personId === 'string' ? body.personId : '';
  const owner = personId ? await findPerson(ctx.deps.store, personId) : null;
  if (!owner) {
    if (!personId) throw err.validation({ personId: 'Choose who this plan is for.' });
    throw err.notFound('Person not found.');
  }
  requireCanActFor(ctx.sessions, owner);

  const parsed = validateEventInput(body);
  if (!parsed.ok) throw err.validation(parsed.fields);
  const nowIso = new Date(ctx.deps.now()).toISOString();
  const event: PlanEvent = {
    id: randomUUID(),
    personId: owner.id,
    ...parsed.value,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await updateJSON<EventsDocument, null>(ctx.deps.store, EVENTS_KEY, emptyEvents(), (doc) => {
    if (doc.events.length >= LIMITS.maxEvents) throw err.validation({}, 'Storage limit reached');
    return { next: { ...doc, events: [...doc.events, event] }, result: null };
  });
  return json({ event }, 201);
};

async function loadOwnedEvent(ctx: Parameters<Handler>[0]): Promise<PlanEvent> {
  const id = ctx.params.id ?? '';
  const events = await readEvents(ctx.deps.store);
  const stored = events.find((e) => e.id === id);
  if (!stored) throw err.notFound('Plan not found.');
  // The owner always comes from storage, never from the request.
  const owner = await findPerson(ctx.deps.store, stored.personId);
  requireCanActFor(ctx.sessions, owner);
  return stored;
}

export const updateEvent: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const stored = await loadOwnedEvent(ctx);
  const body = await readJsonBody(ctx.req);
  if (body.personId !== undefined && body.personId !== stored.personId) {
    throw err.validation({ personId: "A plan can't be moved to someone else." });
  }
  const parsed = validateEventInput(body);
  if (!parsed.ok) throw err.validation(parsed.fields);
  const nowIso = new Date(ctx.deps.now()).toISOString();
  const updated = await updateJSON<EventsDocument, PlanEvent>(ctx.deps.store, EVENTS_KEY, emptyEvents(), (doc) => {
    const current = doc.events.find((e) => e.id === stored.id);
    if (!current) throw err.notFound('Plan not found.');
    const next: PlanEvent = { ...current, ...parsed.value, personId: current.personId, updatedAt: nowIso };
    return { next: { ...doc, events: doc.events.map((e) => (e.id === next.id ? next : e)) }, result: next };
  });
  return json({ event: updated });
};

export const deleteEvent: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const stored = await loadOwnedEvent(ctx);
  await updateJSON<EventsDocument, null>(ctx.deps.store, EVENTS_KEY, emptyEvents(), (doc) => {
    if (!doc.events.some((e) => e.id === stored.id)) throw err.notFound('Plan not found.');
    return { next: { ...doc, events: doc.events.filter((e) => e.id !== stored.id) }, result: null };
  });
  return noContent();
};
