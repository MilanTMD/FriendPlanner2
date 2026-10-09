import { describe, it, expect } from 'vitest';
import {
  isValidISODate,
  parseISODate,
  toISODate,
  addDays,
  diffDays,
  compareISODate,
  daysInclusive,
  eachDay,
  toMonthKey,
  parseMonthKey,
  isValidMonthKey,
  addMonths,
  firstOfMonth,
  lastOfMonth,
  daysInMonth,
  buildMonthWeeks,
  todayLocal,
  coversDay,
  overlaps,
  formatDate,
  formatRange,
  formatDuration,
} from '../../shared/dates';

describe('TZ sanity check', () => {
  it('process.env.TZ is in effect', () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(tz).toBeDefined();
    // Just verify it's set, the actual TZ comes from the test runner
  });
});

describe('shared/dates.ts', () => {
  describe('isValidISODate', () => {
    it('accepts valid dates', () => {
      expect(isValidISODate('2026-10-08')).toBe(true);
      expect(isValidISODate('2028-02-29')).toBe(true); // leap year
      expect(isValidISODate('2000-01-01')).toBe(true);
      expect(isValidISODate('2100-12-31')).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(isValidISODate('2026-02-29')).toBe(false); // not a leap year
      expect(isValidISODate('2026-13-01')).toBe(false); // month out of range
      expect(isValidISODate('2026-1-5')).toBe(false); // not zero-padded
      expect(isValidISODate('2026-04-31')).toBe(false); // day out of range
      expect(isValidISODate('invalid')).toBe(false);
      expect(isValidISODate('')).toBe(false);
    });
  });

  describe('parseISODate / toISODate', () => {
    it('round-trips correctly', () => {
      const date = '2026-10-08';
      const parsed = parseISODate(date);
      const formatted = toISODate(parsed.year, parsed.month, parsed.day);
      expect(formatted).toBe(date);
    });

    it('parses dates correctly', () => {
      const parsed = parseISODate('2028-02-29');
      expect(parsed).toEqual({ year: 2028, month: 2, day: 29 });
    });
  });

  describe('addDays / diffDays across boundaries', () => {
    it('crosses month boundaries', () => {
      expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
      expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    });

    it('crosses year boundaries', () => {
      expect(addDays('2026-12-30', 2)).toBe('2027-01-01');
      expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    });

    it('handles DST dates (spring forward: 2026-03-29, fall back: 2026-10-25 in EU)', () => {
      // These dates should work the same regardless of TZ
      expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
      expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
      expect(diffDays('2026-03-28', '2026-03-29')).toBe(1);
      expect(diffDays('2026-10-24', '2026-10-25')).toBe(1);
    });

    it('diffDays computes differences correctly', () => {
      expect(diffDays('2026-10-08', '2026-10-08')).toBe(0);
      expect(diffDays('2026-10-08', '2026-10-10')).toBe(2);
      expect(diffDays('2026-10-10', '2026-10-08')).toBe(-2);
      expect(diffDays('2026-10-30', '2026-11-02')).toBe(3);
    });
  });

  describe('buildMonthWeeks', () => {
    it('2027-02 starts on Monday (4 rows)', () => {
      const weeks = buildMonthWeeks('2027-02');
      expect(weeks).toHaveLength(4);
      expect(weeks[0]![0]).toBe('2027-02-01'); // Monday
      expect(weeks[0]![6]).toBe('2027-02-07'); // Sunday
    });

    it('2026-08 needs 6 rows', () => {
      const weeks = buildMonthWeeks('2026-08');
      expect(weeks).toHaveLength(6);
    });

    it('weeks start on Monday and end on Sunday', () => {
      const weeks = buildMonthWeeks('2026-10');
      weeks.forEach((week) => {
        expect(week).toHaveLength(7);
        // Day of week: Monday=1, Sunday=7 (per ISO 8601, but we use 0-6 Mon-Sun)
        const dayOfWeek = new Date(week[0] + 'T00:00:00Z').getUTCDay();
        expect(dayOfWeek).toBe(1); // Monday
      });
    });
  });

  describe('todayLocal with fixed instants', () => {
    // This test runs in whatever TZ is set by the test runner
    // For example, at 2026-10-08T22:30:00Z:
    // - In Prague (UTC+2) it is 2026-10-09 00:30
    // - In Los Angeles (UTC-7) it is 2026-10-08 15:30
    it('returns local calendar date', () => {
      const now = new Date('2026-10-08T22:30:00Z');
      const today = todayLocal(now);
      // We can't assert an exact value without knowing the TZ, but we can check the format
      expect(/^\d{4}-\d{2}-\d{2}$/.test(today)).toBe(true);
    });
  });

  describe('compareISODate', () => {
    it('compares dates correctly', () => {
      expect(compareISODate('2026-10-08', '2026-10-08')).toBe(0);
      expect(compareISODate('2026-10-07', '2026-10-08')).toBe(-1);
      expect(compareISODate('2026-10-09', '2026-10-08')).toBe(1);
    });
  });

  describe('daysInclusive', () => {
    it('counts days in an inclusive range', () => {
      expect(daysInclusive('2026-10-08', '2026-10-08')).toBe(1); // single day
      expect(daysInclusive('2026-10-08', '2026-10-10')).toBe(3); // 3 days
      expect(daysInclusive('2026-10-30', '2026-11-02')).toBe(4); // crosses month
    });
  });

  describe('eachDay', () => {
    it('generates all days in a range', () => {
      const days = eachDay('2026-10-08', '2026-10-10');
      expect(days).toEqual(['2026-10-08', '2026-10-09', '2026-10-10']);
    });
  });

  describe('toMonthKey / parseMonthKey / isValidMonthKey', () => {
    it('round-trips correctly', () => {
      const date = '2026-10-08';
      const key = toMonthKey(date);
      expect(key).toBe('2026-10');
      const back = parseMonthKey(key);
      expect(back).toEqual({ year: 2026, month: 10 });
    });

    it('validates month keys', () => {
      expect(isValidMonthKey('2026-10')).toBe(true);
      expect(isValidMonthKey('2026-13')).toBe(false);
      expect(isValidMonthKey('invalid')).toBe(false);
    });
  });

  describe('addMonths', () => {
    it('adds months correctly', () => {
      expect(addMonths('2026-10', 1)).toBe('2026-11');
      expect(addMonths('2026-12', 1)).toBe('2027-01');
      expect(addMonths('2026-01', -1)).toBe('2025-12');
    });
  });

  describe('firstOfMonth / lastOfMonth / daysInMonth', () => {
    it('finds month boundaries', () => {
      expect(firstOfMonth('2026-10')).toBe('2026-10-01');
      expect(lastOfMonth('2026-10')).toBe('2026-10-31');
      expect(daysInMonth('2026-10')).toBe(31);
      expect(daysInMonth('2026-02')).toBe(28);
      expect(daysInMonth('2028-02')).toBe(29); // leap
    });
  });

  describe('coversDay', () => {
    it('checks if a day is covered by a range', () => {
      expect(coversDay('2026-10-08', '2026-10-10', '2026-10-08')).toBe(true);
      expect(coversDay('2026-10-08', '2026-10-10', '2026-10-09')).toBe(true);
      expect(coversDay('2026-10-08', '2026-10-10', '2026-10-10')).toBe(true);
      expect(coversDay('2026-10-08', '2026-10-10', '2026-10-07')).toBe(false);
      expect(coversDay('2026-10-08', '2026-10-10', '2026-10-11')).toBe(false);
    });
  });

  describe('overlaps', () => {
    it('detects overlapping inclusive ranges', () => {
      // [10-08, 10-10] and [10-09, 10-11] overlap
      expect(overlaps('2026-10-08', '2026-10-10', '2026-10-09', '2026-10-11')).toBe(
        true
      );
      // [10-08, 10-10] and [10-10, 10-12] overlap (touching inclusive)
      expect(overlaps('2026-10-08', '2026-10-10', '2026-10-10', '2026-10-12')).toBe(
        true
      );
      // [10-08, 10-10] and [10-11, 10-12] don't overlap
      expect(overlaps('2026-10-08', '2026-10-10', '2026-10-11', '2026-10-12')).toBe(
        false
      );
      // Single day [10-08, 10-08] and [10-08, 10-08] overlap
      expect(overlaps('2026-10-08', '2026-10-08', '2026-10-08', '2026-10-08')).toBe(
        true
      );
    });
  });

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      // Format depends on the TZ, but we can at least check it doesn't crash
      const formatted = formatDate('2026-10-08');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('formatRange', () => {
    it('formats single-day ranges', () => {
      const range = formatRange('2026-10-08', '2026-10-08');
      expect(range).toContain('8'); // At least the day
    });

    it('formats multi-day ranges same month', () => {
      const range = formatRange('2026-10-08', '2026-10-16');
      expect(range).toContain('8');
      expect(range).toContain('16');
    });

    it('formats ranges crossing months', () => {
      const range = formatRange('2026-10-30', '2026-11-02');
      expect(range).toContain('30');
      expect(range).toContain('2');
    });
  });

  describe('formatDuration', () => {
    it('formats durations correctly', () => {
      expect(formatDuration('2026-10-08', '2026-10-08')).toBe('1 day');
      expect(formatDuration('2026-10-08', '2026-10-09')).toBe('2 days');
      expect(formatDuration('2026-10-08', '2026-10-17')).toBe('10 days');
    });
  });
});
