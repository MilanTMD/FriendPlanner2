import type { PersonColorId } from './types';

export const PERSON_COLOR_IDS: readonly PersonColorId[] = [
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12',
];

/** UI copy only; the stored value is always the id. */
export const PERSON_COLOR_NAMES: Record<PersonColorId, string> = {
  c1: 'Blue',
  c2: 'Orange',
  c3: 'Green',
  c4: 'Pink',
  c5: 'Sky',
  c6: 'Red',
  c7: 'Yellow',
  c8: 'Purple',
  c9: 'Turquoise',
  c10: 'Brown',
  c11: 'Lime',
  c12: 'Slate',
};

export function isPersonColorId(value: unknown): value is PersonColorId {
  return typeof value === 'string' && (PERSON_COLOR_IDS as readonly string[]).includes(value);
}

/** First palette color not in `taken`; falls back to the least-used color when all 12 are taken. */
export function firstUnusedColor(taken: readonly string[]): PersonColorId {
  const unused = PERSON_COLOR_IDS.find((id) => !taken.includes(id));
  if (unused) return unused;
  const counts = new Map<string, number>();
  for (const id of taken) counts.set(id, (counts.get(id) ?? 0) + 1);
  let best: PersonColorId = 'c1';
  let bestCount = Number.POSITIVE_INFINITY;
  for (const id of PERSON_COLOR_IDS) {
    const n = counts.get(id) ?? 0;
    if (n < bestCount) {
      best = id;
      bestCount = n;
    }
  }
  return best;
}
