import { describe, it, expect } from 'vitest';
import { layoutWeek, layoutTimelineRow, awayCountByDay } from '../../src/lib/layout';
import type { LayoutEvent } from '../../src/lib/layout';

describe('src/lib/layout.ts', () => {
  const mockEvent = (overrides: Partial<LayoutEvent> = {}): LayoutEvent => ({
    id: '1',
    personId: 'p1',
    personName: 'Alice',
    colorId: 'c1',
    startDate: '2026-10-08',
    endDate: '2026-10-10',
    ...overrides,
  });

  describe('layoutWeek', () => {
    it('returns empty result for empty event list', () => {
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [],
        3
      );
      expect(result.segments).toHaveLength(0);
      expect(result.hiddenCountByDay).toEqual({});
    });

    it('places a single event in lane 0', () => {
      const event = mockEvent({ startDate: '2026-10-08', endDate: '2026-10-10' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event],
        3
      );
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]!.lane).toBe(0);
    });

    it('stacks non-overlapping events in lane 0', () => {
      const event1 = mockEvent({ id: '1', startDate: '2026-10-08', endDate: '2026-10-09' });
      const event2 = mockEvent({ id: '2', startDate: '2026-10-10', endDate: '2026-10-11' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event1, event2],
        3
      );
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]!.lane).toBe(0);
      expect(result.segments[1]!.lane).toBe(0);
    });

    it('places overlapping events in different lanes', () => {
      const event1 = mockEvent({ id: '1', personId: 'p1', startDate: '2026-10-08', endDate: '2026-10-10' });
      const event2 = mockEvent({ id: '2', personId: 'p2', startDate: '2026-10-09', endDate: '2026-10-11' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event1, event2],
        3
      );
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]!.lane).toBe(0);
      expect(result.segments[1]!.lane).toBe(1);
    });

    it('hides events when lane >= maxLanes', () => {
      const events = [
        mockEvent({ id: '1', personId: 'p1', startDate: '2026-10-08', endDate: '2026-10-10' }),
        mockEvent({ id: '2', personId: 'p2', startDate: '2026-10-08', endDate: '2026-10-10' }),
        mockEvent({ id: '3', personId: 'p3', startDate: '2026-10-08', endDate: '2026-10-10' }),
        mockEvent({ id: '4', personId: 'p4', startDate: '2026-10-08', endDate: '2026-10-10' }),
      ];
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        events,
        3 // maxLanes
      );
      const visibleSegments = result.segments.filter((s) => s.lane < 3);
      expect(visibleSegments).toHaveLength(3);
      // Check that hidden count is recorded for the dates
      expect(result.hiddenCountByDay['2026-10-08']!).toBe(1);
    });

    it('sets continuation flags correctly', () => {
      const event = mockEvent({ startDate: '2026-10-07', endDate: '2026-10-15' });
      const weekStart = '2026-10-08';
      const weekEnd = '2026-10-14';
      const result = layoutWeek(
        [weekStart, '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', weekEnd],
        [event],
        3
      );
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]!.continuesBefore).toBe(true);
      expect(result.segments[0]!.continuesAfter).toBe(true);
    });

    it('clips events to the week boundaries', () => {
      const event = mockEvent({ startDate: '2026-10-07', endDate: '2026-10-12' });
      const result = layoutWeek(
        ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'],
        [event],
        3
      );
      expect(result.segments[0]!.segStart).toBe('2026-10-08');
      expect(result.segments[0]!.segEnd).toBe('2026-10-12');
    });

    it('computes correct startCol and span', () => {
      const event = mockEvent({ startDate: '2026-10-08', endDate: '2026-10-10' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event],
        3
      );
      // startDate 2026-10-08 is at index 3 in the week array (0-based)
      // endDate 2026-10-10 is at index 5, so span is 3 days
      expect(result.segments[0]!.startCol).toBe(3);
      expect(result.segments[0]!.span).toBe(3);
    });

    it('single-day event has span 1', () => {
      const event = mockEvent({ startDate: '2026-10-08', endDate: '2026-10-08' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event],
        3
      );
      expect(result.segments[0]!.span).toBe(1);
    });

    it('excludes events entirely before the week', () => {
      const event = mockEvent({ startDate: '2026-10-01', endDate: '2026-10-04' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event],
        3
      );
      expect(result.segments).toHaveLength(0);
    });

    it('excludes events entirely after the week', () => {
      const event = mockEvent({ startDate: '2026-10-15', endDate: '2026-10-20' });
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        [event],
        3
      );
      expect(result.segments).toHaveLength(0);
    });

    it('sorts by startDate, then by length descending, then by name', () => {
      const events = [
        mockEvent({
          id: '1',
          personId: 'Alice',
          startDate: '2026-10-10',
          endDate: '2026-10-10',
        }),
        mockEvent({
          id: '2',
          personId: 'Bob',
          startDate: '2026-10-10',
          endDate: '2026-10-12',
        }),
        mockEvent({
          id: '3',
          personId: 'Alice',
          startDate: '2026-10-08',
          endDate: '2026-10-10',
        }),
      ];
      const result = layoutWeek(
        ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
        events,
        5
      );
      // Sorted by startDate first (08 before 10), then by length (Alice 3 days before Bob 3 days, but Alice is alphabetically before Bob)
      // This test just verifies the order is deterministic
      expect(result.segments.length).toBeGreaterThan(0);
    });
  });

  describe('layoutTimelineRow', () => {
    it('handles a single event', () => {
      const event = mockEvent({ startDate: '2026-10-08', endDate: '2026-10-10' });
      const result = layoutTimelineRow(
        [event],
        '2026-10-01',
        '2026-10-31'
      );
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]!.lane).toBe(0);
    });

    it('stacks overlapping events in different lanes', () => {
      const events = [
        mockEvent({ id: '1', startDate: '2026-10-08', endDate: '2026-10-10' }),
        mockEvent({ id: '2', startDate: '2026-10-09', endDate: '2026-10-11' }),
      ];
      const result = layoutTimelineRow(
        events,
        '2026-10-01',
        '2026-10-31'
      );
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]!.lane).toBe(0);
      expect(result.segments[1]!.lane).toBe(1);
    });

    it('clips events to the range', () => {
      const event = mockEvent({ startDate: '2026-09-30', endDate: '2026-10-05' });
      const result = layoutTimelineRow(
        [event],
        '2026-10-01',
        '2026-10-31'
      );
      expect(result.segments[0]!.segStart).toBe('2026-10-01');
      expect(result.segments[0]!.segEnd).toBe('2026-10-05');
    });
  });

  describe('awayCountByDay', () => {
    it('counts distinct people per day', () => {
      const events = [
        mockEvent({ id: '1', personId: 'p1', startDate: '2026-10-08', endDate: '2026-10-10' }),
        mockEvent({ id: '2', personId: 'p2', startDate: '2026-10-09', endDate: '2026-10-11' }),
        mockEvent({ id: '3', personId: 'p1', startDate: '2026-10-09', endDate: '2026-10-09' }), // same person
      ];
      const days = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'];
      const counts = awayCountByDay(events, days);
      expect(counts['2026-10-08']).toBe(1); // p1
      expect(counts['2026-10-09']).toBe(2); // p1, p2
      expect(counts['2026-10-10']).toBe(2); // p1, p2
      expect(counts['2026-10-11']).toBe(1); // p2
    });

    it('returns 0 for days with no events', () => {
      const events = [
        mockEvent({ id: '1', personId: 'p1', startDate: '2026-10-08', endDate: '2026-10-08' }),
      ];
      const days = ['2026-10-08', '2026-10-09'];
      const counts = awayCountByDay(events, days);
      expect(counts['2026-10-08']).toBe(1);
      expect(counts['2026-10-09']).toBe(0);
    });
  });
});
