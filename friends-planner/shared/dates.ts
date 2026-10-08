/**
 * The ONLY module that handles calendar dates.
 *
 * Rules (BRIEF section 5.4):
 *  - Calendar dates are 'YYYY-MM-DD' strings, months are 'YYYY-MM'.
 *  - All arithmetic is pure integer day-number maths (proleptic Gregorian). No Date parsing,
 *    no local getters, no toISOString, so process/browser time zones can never shift a date.
 *  - `todayLocal` is the one function that reads the local clock (and the only place that uses
 *    local getters). It is the single source of "today" so tests can control it via page.clock.
 *  - Formatting uses fixed English name tables (en-GB conventions) instead of Intl, which keeps the
 *    output identical on every ICU version (en-GB abbreviates September as "Sept" in newer ICU).
 */
import type { ISODate, MonthKey } from './types';

export type { ISODate, MonthKey };

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Min/max year accepted for month keys in the URL (events are limited more strictly by validation). */
const MONTH_KEY_MIN_YEAR = 1900;
const MONTH_KEY_MAX_YEAR = 2199;

/* ---------- integer civil-calendar maths ---------- */

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonthNum(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Days since 1970-01-01 (Howard Hinnant's days_from_civil). */
function toDayNumber(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = month + (month > 2 ? -3 : 9);
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function fromDayNumber(dayNumber: number): DateParts {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/* ---------- validation / parsing ---------- */

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonthNum(year, month);
}

/** Splits a valid ISO date into numbers. Throws on invalid input. */
export function parseISODate(date: ISODate): DateParts {
  const m = ISO_RE.exec(date);
  if (!m || !isValidISODate(date)) throw new RangeError(`Invalid ISO date: ${String(date)}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function toISODate(year: number, month: number, day: number): ISODate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function dayNumberOf(date: ISODate): number {
  const { year, month, day } = parseISODate(date);
  return toDayNumber(year, month, day);
}

function fromNumber(dayNumber: number): ISODate {
  const { year, month, day } = fromDayNumber(dayNumber);
  return toISODate(year, month, day);
}

/* ---------- arithmetic and comparison ---------- */

export function addDays(date: ISODate, days: number): ISODate {
  return fromNumber(dayNumberOf(date) + days);
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return dayNumberOf(b) - dayNumberOf(a);
}

/** Valid ISO strings compare correctly as plain strings. */
export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive length of a range: a single day is 1. */
export function daysInclusive(start: ISODate, end: ISODate): number {
  return diffDays(start, end) + 1;
}

/** Every day from start to end, inclusive. */
export function eachDay(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  const first = dayNumberOf(start);
  const last = dayNumberOf(end);
  for (let n = first; n <= last; n += 1) out.push(fromNumber(n));
  return out;
}

/** Monday = 0 ... Sunday = 6. */
export function weekdayIndexMon0(date: ISODate): number {
  // 1970-01-01 was a Thursday (Mon0 index 3).
  return (((dayNumberOf(date) + 3) % 7) + 7) % 7;
}

export function startOfWeekMon(date: ISODate): ISODate {
  return addDays(date, -weekdayIndexMon0(date));
}

export function coversDay(startDate: ISODate, endDate: ISODate, day: ISODate): boolean {
  return startDate <= day && day <= endDate;
}

export function overlaps(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/* ---------- months ---------- */

export function toMonthKey(date: ISODate): MonthKey {
  const { year, month } = parseISODate(date);
  return `${pad(year, 4)}-${pad(month, 2)}`;
}

export function isValidMonthKey(value: unknown): value is MonthKey {
  if (typeof value !== 'string') return false;
  const m = MONTH_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  return year >= MONTH_KEY_MIN_YEAR && year <= MONTH_KEY_MAX_YEAR && month >= 1 && month <= 12;
}

export function parseMonthKey(month: MonthKey): { year: number; month: number } {
  const m = MONTH_RE.exec(month);
  if (!m || !isValidMonthKey(month)) throw new RangeError(`Invalid month key: ${String(month)}`);
  return { year: Number(m[1]), month: Number(m[2]) };
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const { year, month: m } = parseMonthKey(month);
  const index = year * 12 + (m - 1) + delta;
  const newYear = Math.floor(index / 12);
  const newMonth = index - newYear * 12 + 1;
  return `${pad(newYear, 4)}-${pad(newMonth, 2)}`;
}

export function firstOfMonth(month: MonthKey): ISODate {
  const { year, month: m } = parseMonthKey(month);
  return toISODate(year, m, 1);
}

export function lastOfMonth(month: MonthKey): ISODate {
  const { year, month: m } = parseMonthKey(month);
  return toISODate(year, m, daysInMonthNum(year, m));
}

export function daysInMonth(month: MonthKey): number {
  const { year, month: m } = parseMonthKey(month);
  return daysInMonthNum(year, m);
}

/** Monday-start weeks (7 ISO dates each) that cover the month, 4-6 rows. */
export function buildMonthWeeks(month: MonthKey): ISODate[][] {
  const first = firstOfMonth(month);
  const last = lastOfMonth(month);
  const weeks: ISODate[][] = [];
  let cursor = startOfWeekMon(first);
  while (cursor <= last) {
    const week: ISODate[] = [];
    for (let i = 0; i < 7; i += 1) week.push(addDays(cursor, i));
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

/* ---------- "today" (the only reader of the local clock) ---------- */

/** The user's local calendar date. The ONLY function that uses local getters. */
export function todayLocal(now: Date = new Date()): ISODate {
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/* ---------- formatting ---------- */

function weekdayNameOf(date: ISODate): string {
  return WEEKDAY_NAMES[weekdayIndexMon0(date)] ?? '';
}
function weekdayShortOf(date: ISODate): string {
  return WEEKDAY_SHORT[weekdayIndexMon0(date)] ?? '';
}

export type DateFormat =
  | 'full' // Monday 12 October 2026
  | 'long' // Mon 12 Oct 2026
  | 'short' // 12 Oct
  | 'weekdayShort' // Mon
  | 'weekdayLong' // Monday
  | 'dayMonth'; // 12 Oct (same as short)

export function formatDate(date: ISODate, format: DateFormat = 'long'): string {
  const { year, month, day } = parseISODate(date);
  const monthLong = MONTH_NAMES[month - 1] ?? '';
  const monthShort = MONTH_SHORT[month - 1] ?? '';
  switch (format) {
    case 'full':
      return `${weekdayNameOf(date)} ${day} ${monthLong} ${year}`;
    case 'long':
      return `${weekdayShortOf(date)} ${day} ${monthShort} ${year}`;
    case 'short':
    case 'dayMonth':
      return `${day} ${monthShort}`;
    case 'weekdayShort':
      return weekdayShortOf(date);
    case 'weekdayLong':
      return weekdayNameOf(date);
  }
}

/** "October 2026" or, when `short`, "Oct 2026". */
export function formatMonth(month: MonthKey, short = false): string {
  const { year, month: m } = parseMonthKey(month);
  return `${(short ? MONTH_SHORT : MONTH_NAMES)[m - 1] ?? ''} ${year}`;
}

/**
 * Inclusive range, with the year at the end:
 *  - single day: "Sat 15 Mar 2031"
 *  - same month: "12-16 Oct 2026" (en dash)
 *  - across months: "30 Jan - 2 Feb 2031"
 *  - across years: "30 Dec 2030 - 2 Jan 2031"
 */
export function formatRange(start: ISODate, end: ISODate): string {
  if (start === end) return formatDate(start, 'long');
  const a = parseISODate(start);
  const b = parseISODate(end);
  const startShort = MONTH_SHORT[a.month - 1] ?? '';
  const endShort = MONTH_SHORT[b.month - 1] ?? '';
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${endShort} ${b.year}`;
  }
  if (a.year === b.year) {
    return `${a.day} ${startShort} – ${b.day} ${endShort} ${b.year}`;
  }
  return `${a.day} ${startShort} ${a.year} – ${b.day} ${endShort} ${b.year}`;
}

/** Like formatRange but without the year ("12-16 Oct"); used in compact lists. */
export function formatRangeShort(start: ISODate, end: ISODate): string {
  if (start === end) return formatDate(start, 'short');
  const a = parseISODate(start);
  const b = parseISODate(end);
  const startShort = MONTH_SHORT[a.month - 1] ?? '';
  const endShort = MONTH_SHORT[b.month - 1] ?? '';
  if (a.month === b.month && a.year === b.year) return `${a.day}–${b.day} ${endShort}`;
  return `${a.day} ${startShort} – ${b.day} ${endShort}`;
}

/** "1 day" / "N days". */
export function formatDuration(start: ISODate, end: ISODate): string {
  const n = daysInclusive(start, end);
  return n === 1 ? '1 day' : `${n} days`;
}

/** "day 2 of 5". `day` must be within the range. */
export function formatPosition(day: ISODate, start: ISODate, end: ISODate): string {
  return `day ${diffDays(start, day) + 1} of ${daysInclusive(start, end)}`;
}
