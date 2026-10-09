import { describe, it, expect } from 'vitest';
import {
  validateName,
  validatePin,
  validatePersonCreate,
  validateEventInput,
  validateDateRange,
} from '../../shared/validation';

describe('shared/validation.ts', () => {
  describe('validateName', () => {
    it('accepts valid names', () => {
      const result = validateName('Alice');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('Alice');
    });

    it('trims and collapses whitespace', () => {
      const result = validateName('  Alice   Bob  ');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('Alice Bob');
    });

    it('enforces length limits', () => {
      const result = validateName('');
      expect(result.ok).toBe(false);

      const tooLong = 'a'.repeat(41);
      const result2 = validateName(tooLong);
      expect(result2.ok).toBe(false);
    });

    it('requires non-whitespace content', () => {
      const result = validateName('   ');
      expect(result.ok).toBe(false);
    });
  });

  describe('validatePin', () => {
    it('accepts valid 4-6 digit PINs', () => {
      expect(validatePin('1234').ok).toBe(true);
      expect(validatePin('12345').ok).toBe(true);
      expect(validatePin('123456').ok).toBe(true);
    });

    it('rejects PINs outside the range', () => {
      expect(validatePin('123').ok).toBe(false);
      expect(validatePin('1234567').ok).toBe(false);
    });

    it('rejects non-numeric PINs', () => {
      expect(validatePin('12a4').ok).toBe(false);
      expect(validatePin('12-34').ok).toBe(false);
      expect(validatePin('12 34').ok).toBe(false);
    });
  });

  describe('validatePersonCreate', () => {
    it('validates name, color, and PIN', () => {
      const result = validatePersonCreate({
        name: 'Alice',
        colorId: 'c1',
        pin: '1234',
        remember: true,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Alice');
        expect(result.value.colorId).toBe('c1');
      }
    });

    it('rejects with invalid inputs', () => {
      const result = validatePersonCreate({
        name: '',
        colorId: 'invalid',
        pin: '12',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.fields.name).toBeDefined();
        expect(result.fields.colorId).toBeDefined();
        expect(result.fields.pin).toBeDefined();
      }
    });
  });

  describe('validateEventInput', () => {
    it('validates event with title, place, and dates', () => {
      const result = validateEventInput({
        title: 'Ski trip',
        place: 'Prague',
        startDate: '2026-10-08',
        endDate: '2026-10-10',
        notes: 'Have fun',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Ski trip');
        expect(result.value.place).toBe('Prague');
      }
    });

    it('trims whitespace on title and place', () => {
      const result = validateEventInput({
        title: '  Ski trip  ',
        place: '  Prague  ',
        startDate: '2026-10-08',
        endDate: '2026-10-10',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Ski trip');
        expect(result.value.place).toBe('Prague');
      }
    });

    it('enforces length limits on title', () => {
      const result = validateEventInput({
        title: 'a'.repeat(81),
        place: 'Prague',
        startDate: '2026-10-08',
        endDate: '2026-10-10',
      });
      expect(result.ok).toBe(false);
    });

    it('allows empty notes', () => {
      const result = validateEventInput({
        title: 'Test',
        place: 'Prague',
        startDate: '2026-10-08',
        endDate: '2026-10-08',
        notes: '',
      });
      expect(result.ok).toBe(true);
    });

    it('trims end whitespace on notes', () => {
      const result = validateEventInput({
        title: 'Test',
        place: 'Prague',
        startDate: '2026-10-08',
        endDate: '2026-10-08',
        notes: 'Some notes  \n  ',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes).toBe('Some notes');
      }
    });
  });

  describe('validateDateRange', () => {
    it('accepts valid ranges', () => {
      const errors = validateDateRange('2026-10-08', '2026-10-10');
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('accepts single-day plans', () => {
      const errors = validateDateRange('2026-10-08', '2026-10-08');
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('rejects end-before-start', () => {
      const errors = validateDateRange('2026-10-10', '2026-10-08');
      expect(errors.endDate).toBeDefined();
    });

    it('rejects spans longer than 366 days', () => {
      const errors = validateDateRange('2026-01-01', '2027-01-02');
      expect(errors.endDate).toBeDefined();
    });

    it('accepts spans of 366 days', () => {
      const errors = validateDateRange('2026-01-01', '2027-01-01');
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('rejects invalid dates', () => {
      const errors = validateDateRange('invalid', '2026-10-10');
      expect(errors.startDate).toBeDefined();

      const errors2 = validateDateRange('2026-10-08', 'invalid');
      expect(errors2.endDate).toBeDefined();
    });

    it('enforces year range', () => {
      const errors = validateDateRange('1999-01-01', '1999-12-31');
      expect(errors.startDate).toBeDefined();

      const errors2 = validateDateRange('2101-01-01', '2101-12-31');
      expect(errors2.startDate).toBeDefined();
    });
  });
});
