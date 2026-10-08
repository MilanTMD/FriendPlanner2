import { randomUUID } from 'node:crypto';
import type { PeopleDocument, StoredPerson } from '../../../shared/types';
import { LIMITS, isValidPin, nameKey, validatePersonCreate, validatePersonPatch } from '../../../shared/validation';
import { personCookie, requireAdmin, requireCanActFor, requireGroup } from '../auth';
import type { Handler } from '../context';
import { hashPin, verifyPin } from '../crypto';
import { ApiError, err, json, noContent, readJsonBody } from '../http';
import {
  PEOPLE_KEY,
  deletePersonCascade,
  emptyPeople,
  findPerson,
  readPeople,
  sortPeople,
  toPersonDTO,
} from '../repo';
import { updateJSON } from '../store';
import {
  PIN_POLICY,
  assertNotLocked,
  clearThrottle,
  pinKey,
  recordFailure,
  recordSuccess,
} from '../throttle';

const nameTaken = () =>
  new ApiError(409, 'NAME_TAKEN', 'That name is taken.', { fields: { name: 'That name is taken.' } });

export const listPeople: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const people = await readPeople(ctx.deps.store);
  return json({ people: sortPeople(people.map(toPersonDTO)) });
};

export const createPerson: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const body = await readJsonBody(ctx.req);
  const parsed = validatePersonCreate(body);
  if (!parsed.ok) throw err.validation(parsed.fields);
  const input = parsed.value;
  const pinHash = await hashPin(input.pin);
  const nowIso = new Date(ctx.deps.now()).toISOString();

  const stored = await updateJSON<PeopleDocument, StoredPerson>(ctx.deps.store, PEOPLE_KEY, emptyPeople(), (doc) => {
    if (doc.people.length >= LIMITS.maxPeople) {
      throw err.validation({ name: 'The group is full.' }, 'The group is full.');
    }
    const key = nameKey(input.name);
    if (doc.people.some((p) => nameKey(p.name) === key)) throw nameTaken();
    const person: StoredPerson = {
      id: randomUUID(),
      name: input.name,
      colorId: input.colorId,
      createdAt: nowIso,
      pinHash,
      pinChangedAt: nowIso,
    };
    return { next: { ...doc, people: [...doc.people, person] }, result: person };
  });

  const headers = new Headers();
  headers.append('Set-Cookie', personCookie(ctx.req, ctx.keys, stored, input.remember, ctx.deps.now()));
  return json({ person: toPersonDTO(stored) }, 201, headers);
};

export const patchPerson: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const id = ctx.params.id ?? '';
  const existing = await findPerson(ctx.deps.store, id);
  if (!existing) throw err.notFound('Person not found.');
  requireCanActFor(ctx.sessions, existing);
  const body = await readJsonBody(ctx.req);
  const parsed = validatePersonPatch(body);
  if (!parsed.ok) throw err.validation(parsed.fields);
  const patch = parsed.value;

  const updated = await updateJSON<PeopleDocument, StoredPerson>(ctx.deps.store, PEOPLE_KEY, emptyPeople(), (doc) => {
    const current = doc.people.find((p) => p.id === id);
    if (!current) throw err.notFound('Person not found.');
    if (patch.name !== undefined) {
      const key = nameKey(patch.name);
      if (doc.people.some((p) => p.id !== id && nameKey(p.name) === key)) throw nameTaken();
    }
    const next: StoredPerson = {
      ...current,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.colorId !== undefined ? { colorId: patch.colorId } : {}),
    };
    return { next: { ...doc, people: doc.people.map((p) => (p.id === id ? next : p)) }, result: next };
  });
  return json({ person: toPersonDTO(updated) });
};

export const deletePerson: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  requireAdmin(ctx.sessions);
  const id = ctx.params.id ?? '';
  const existing = await findPerson(ctx.deps.store, id);
  if (!existing) throw err.notFound('Person not found.');
  await deletePersonCascade(ctx.deps.store, id);
  await clearThrottle(ctx.deps.store, pinKey(id));
  return noContent();
};

export const verifyPersonPin: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  const id = ctx.params.id ?? '';
  const body = await readJsonBody(ctx.req);
  const person = await findPerson(ctx.deps.store, id);
  if (!person) throw err.notFound('Person not found.');

  const key = pinKey(id);
  const now = ctx.deps.now();
  // Check the lock BEFORE running scrypt.
  await assertNotLocked(ctx.deps.store, key, now, ' or ask the admin to reset your PIN.');

  if (!isValidPin(body.pin)) throw err.validation({ pin: 'Use 4–6 digits.' });
  const ok = await verifyPin(body.pin, person.pinHash);
  if (!ok) {
    const outcome = await recordFailure(ctx.deps.store, key, PIN_POLICY, now);
    throw new ApiError(
      403,
      'PIN_INVALID',
      `Wrong PIN. ${outcome.remainingAttempts} ${outcome.remainingAttempts === 1 ? 'try' : 'tries'} left before a short lock.`,
      {
        remainingAttempts: outcome.remainingAttempts,
        ...(outcome.locked ? { retryAfterSeconds: outcome.retryAfterSeconds } : {}),
      },
    );
  }
  await recordSuccess(ctx.deps.store, key);
  const headers = new Headers();
  headers.append('Set-Cookie', personCookie(ctx.req, ctx.keys, person, body.remember === true, now));
  return json({ person: toPersonDTO(person) }, 200, headers);
};

export const resetPin: Handler = async (ctx) => {
  requireGroup(ctx.sessions);
  requireAdmin(ctx.sessions);
  const id = ctx.params.id ?? '';
  const body = await readJsonBody(ctx.req);
  if (!isValidPin(body.newPin)) throw err.validation({ newPin: 'Use 4–6 digits.' });
  const existing = await findPerson(ctx.deps.store, id);
  if (!existing) throw err.notFound('Person not found.');
  const pinHash = await hashPin(body.newPin);
  const nowIso = new Date(ctx.deps.now()).toISOString();
  await updateJSON<PeopleDocument, null>(ctx.deps.store, PEOPLE_KEY, emptyPeople(), (doc) => {
    if (!doc.people.some((p) => p.id === id)) throw err.notFound('Person not found.');
    return {
      next: {
        ...doc,
        people: doc.people.map((p) => (p.id === id ? { ...p, pinHash, pinChangedAt: nowIso } : p)),
      },
      result: null,
    };
  });
  await clearThrottle(ctx.deps.store, pinKey(id));
  return noContent();
};
