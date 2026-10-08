/**
 * Pure layout functions for the month grid and the timeline (BRIEF section 4.5).
 * Everything works on 'YYYY-MM-DD' strings and inclusive ranges; there is no Date handling here.
 */
import { buildMonthWeeks, daysInclusive, diffDays, eachDay } from '../../shared/dates';
import type { ISODate, PersonColorId } from '../../shared/types';

export { buildMonthWeeks };

/** The minimum an event needs for layout. */
export interface LayoutEvent {
  id: string;
  personId: string;
  personName: string;
  colorId: PersonColorId;
  startDate: ISODate;
  endDate: ISODate;
}

export interface Segment {
  eventId: string;
  personId: string;
  colorId: PersonColorId;
  /** 0-based column inside the range (0-6 for a week). */
  startCol: number;
  /** Number of columns covered, at least 1. */
  span: number;
  lane: number;
  segStart: ISODate;
  segEnd: ISODate;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface WeekLayout {
  /** Visible segments only (lane < maxLanes). */
  segments: Segment[];
  /** Number of hidden events covering each day (only days with at least one are present). */
  hiddenCountByDay: Record<ISODate, number>;
}

export interface TimelineRowLayout {
  segments: Segment[];
  /** Lanes used by this row, at least 1. */
  laneCount: number;
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** startDate ascending, inclusive length descending, person name, id. */
export function compareForLayout(a: LayoutEvent, b: LayoutEvent): number {
  if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
  const lenA = daysInclusive(a.startDate, a.endDate);
  const lenB = daysInclusive(b.startDate, b.endDate);
  if (lenA !== lenB) return lenB - lenA;
  const byName = collator.compare(a.personName, b.personName);
  if (byName !== 0) return byName;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Clips events to [rangeStart, rangeEnd], sorts, and packs them greedily (first-fit) into lanes. */
function pack(events: readonly LayoutEvent[], rangeStart: ISODate, rangeEnd: ISODate): Segment[] {
  const relevant = events
    .filter((e) => e.startDate <= rangeEnd && e.endDate >= rangeStart)
    .sort(compareForLayout);
  const laneEnds: number[] = []; // last occupied column per lane
  const segments: Segment[] = [];
  for (const e of relevant) {
    const segStart = e.startDate > rangeStart ? e.startDate : rangeStart;
    const segEnd = e.endDate < rangeEnd ? e.endDate : rangeEnd;
    const startCol = diffDays(rangeStart, segStart);
    const endCol = diffDays(rangeStart, segEnd);
    let lane = laneEnds.findIndex((last) => last < startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endCol);
    } else {
      laneEnds[lane] = endCol;
    }
    segments.push({
      eventId: e.id,
      personId: e.personId,
      colorId: e.colorId,
      startCol,
      span: endCol - startCol + 1,
      lane,
      segStart,
      segEnd,
      continuesBefore: e.startDate < rangeStart,
      continuesAfter: e.endDate > rangeEnd,
    });
  }
  return segments;
}

/**
 * Lays out one Monday-start week. `weekDays` has 7 ISO dates.
 * Segments in lanes >= maxLanes are hidden and counted per day instead.
 */
export function layoutWeek(weekDays: readonly ISODate[], events: readonly LayoutEvent[], maxLanes: number): WeekLayout {
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  if (first === undefined || last === undefined) return { segments: [], hiddenCountByDay: {} };
  const all = pack(events, first, last);
  const segments: Segment[] = [];
  const hiddenCountByDay: Record<ISODate, number> = {};
  for (const seg of all) {
    if (seg.lane < maxLanes) {
      segments.push(seg);
      continue;
    }
    for (const day of eachDay(seg.segStart, seg.segEnd)) {
      hiddenCountByDay[day] = (hiddenCountByDay[day] ?? 0) + 1;
    }
  }
  return { segments, hiddenCountByDay };
}

/** Same clipping and lane packing, within one person's timeline row. */
export function layoutTimelineRow(
  personEvents: readonly LayoutEvent[],
  rangeStart: ISODate,
  rangeEnd: ISODate,
): TimelineRowLayout {
  const segments = pack(personEvents, rangeStart, rangeEnd);
  const laneCount = segments.reduce((max, s) => Math.max(max, s.lane + 1), 1);
  return { segments, laneCount };
}

/** Distinct people covering each day (after any filter has been applied by the caller). */
export function awayCountByDay(
  events: readonly Pick<LayoutEvent, 'personId' | 'startDate' | 'endDate'>[],
  days: readonly ISODate[],
): Record<ISODate, number> {
  const out: Record<ISODate, number> = {};
  for (const day of days) {
    const people = new Set<string>();
    for (const e of events) {
      if (e.startDate <= day && day <= e.endDate) people.add(e.personId);
    }
    out[day] = people.size;
  }
  return out;
}
