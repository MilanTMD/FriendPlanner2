/** Validators shared by the client forms and the server (BRIEF section 5.3). */
import { isPersonColorId } from './colors';
import { daysInclusive, isValidISODate } from './dates';
import type { EventInput, ISODate, PersonColorId } from './types';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; fields: Record<string, string> };

export const LIMITS = {
  nameMax: 40,
  titleMax: 80,
  placeMax: 80,
  notesMax: 1000,
  maxPeople: 50,
  maxEvents: 5000,
  maxSpanDays: 366,
  minYear: 2000,
  maxYear: 2100,
  maxBodyBytes: 16 * 1024,
} as const;

const PIN_RE = /^\d{4,6}$/;

export function isValidPin(value: unknown): value is string {
  return typeof value === 'string' && PIN_RE.test(value);
}

/** Trim and collapse inner whitespace. */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive comparison key. Accents stay significant ("Klára" is not "Klara"). */
export function nameKey(value: string): string {
  return normalizeName(value).toLocaleLowerCase('en');
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function validateName(value: unknown): { ok: true; value: string } | { ok: false; message: string } {
  const raw = asString(value);
  if (raw === null) return { ok: false, message: 'Enter a name.' };
  const name = normalizeName(raw);
  if (name.length < 1) return { ok: false, message: 'Enter a name.' };
  if (name.length > LIMITS.nameMax) return { ok: false, message: `Use ${LIMITS.nameMax} characters or fewer.` };
  return { ok: true, value: name };
}

export function validatePin(value: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (!isValidPin(value)) return { ok: false, message: 'Use 4–6 digits.' };
  return { ok: true, value };
}

export interface PersonCreateInput {
  name: string;
  colorId: PersonColorId;
  pin: string;
  remember: boolean;
}

export function validatePersonCreate(body: unknown): ValidationResult<PersonCreateInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const name = validateName(b.name);
  if (!name.ok) fields.name = name.message;
  if (!isPersonColorId(b.colorId)) fields.colorId = 'Pick a color.';
  const pin = validatePin(b.pin);
  if (!pin.ok) fields.pin = pin.message;
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: {
      name: (name as { value: string }).value,
      colorId: b.colorId as PersonColorId,
      pin: b.pin as string,
      remember: b.remember === true,
    },
  };
}

export interface PersonPatchInput {
  name?: string;
  colorId?: PersonColorId;
}

export function validatePersonPatch(body: unknown): ValidationResult<PersonPatchInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const value: PersonPatchInput = {};
  if (b.name !== undefined) {
    const name = validateName(b.name);
    if (name.ok) value.name = name.value;
    else fields.name = name.message;
  }
  if (b.colorId !== undefined) {
    if (isPersonColorId(b.colorId)) value.colorId = b.colorId;
    else fields.colorId = 'Pick a color.';
  }
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value };
}

export interface DateRangeCheck {
  startDate?: string;
  endDate?: string;
}

/** Validates a start/end pair; returns field messages (empty object when OK). */
export function validateDateRange(startDate: unknown, endDate: unknown): DateRangeCheck {
  const errors: DateRangeCheck = {};
  const inRange = (d: string): boolean => {
    const year = Number(d.slice(0, 4));
    return year >= LIMITS.minYear && year <= LIMITS.maxYear;
  };
  if (typeof startDate !== 'string' || startDate === '') {
    errors.startDate = 'Pick a start date.';
  } else if (!isValidISODate(startDate)) {
    errors.startDate = 'Use a valid date.';
  } else if (!inRange(startDate)) {
    errors.startDate = `Use a year between ${LIMITS.minYear} and ${LIMITS.maxYear}.`;
  }
  if (typeof endDate !== 'string' || endDate === '') {
    errors.endDate = 'Pick an end date.';
  } else if (!isValidISODate(endDate)) {
    errors.endDate = 'Use a valid date.';
  } else if (!inRange(endDate)) {
    errors.endDate = `Use a year between ${LIMITS.minYear} and ${LIMITS.maxYear}.`;
  }
  if (!errors.startDate && !errors.endDate) {
    const s = startDate as ISODate;
    const e = endDate as ISODate;
    if (s > e) {
      errors.endDate = "End date can't be before the start.";
    } else if (daysInclusive(s, e) > LIMITS.maxSpanDays) {
      errors.endDate = `A plan can span at most ${LIMITS.maxSpanDays} days.`;
    }
  }
  return errors;
}

export function validateEventInput(body: unknown): ValidationResult<EventInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const titleRaw = asString(b.title);
  const title = titleRaw === null ? '' : titleRaw.trim();
  if (title.length < 1) fields.title = 'Give your plan a name.';
  else if (title.length > LIMITS.titleMax) fields.title = `Use ${LIMITS.titleMax} characters or fewer.`;

  const placeRaw = asString(b.place);
  const place = placeRaw === null ? '' : placeRaw.trim();
  if (place.length < 1) fields.place = 'Where is it?';
  else if (place.length > LIMITS.placeMax) fields.place = `Use ${LIMITS.placeMax} characters or fewer.`;

  let notes = '';
  if (b.notes !== undefined && b.notes !== null) {
    const notesRaw = asString(b.notes);
    if (notesRaw === null) fields.notes = 'Notes must be text.';
    else {
      notes = notesRaw.trimEnd();
      if (notes.length > LIMITS.notesMax) fields.notes = `Use ${LIMITS.notesMax} characters or fewer.`;
    }
  }

  const dateErrors = validateDateRange(b.startDate, b.endDate);
  if (dateErrors.startDate) fields.startDate = dateErrors.startDate;
  if (dateErrors.endDate) fields.endDate = dateErrors.endDate;

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: {
      title,
      place,
      startDate: b.startDate as ISODate,
      endDate: b.endDate as ISODate,
      notes,
    },
  };
}
