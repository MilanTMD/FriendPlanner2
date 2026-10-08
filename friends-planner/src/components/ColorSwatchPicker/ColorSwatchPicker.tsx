import { Check, User } from 'lucide-react';
import { PERSON_COLOR_IDS, PERSON_COLOR_NAMES } from '../../../shared/colors';
import type { Person, PersonColorId } from '../../../shared/types';
import { Icon } from '../Icon/Icon';
import styles from './ColorSwatchPicker.module.css';

export interface ColorSwatchPickerProps {
  value: PersonColorId;
  onChange: (value: PersonColorId) => void;
  /** Everyone in the group; colors they use are marked as taken. */
  people: readonly Person[];
  /** In edit mode the person's own color is not "taken". */
  ignorePersonId?: string;
  name?: string;
}

/** Radio group of the 12 person colors. Taken colors are disabled until all 12 are in use. */
export function ColorSwatchPicker({ value, onChange, people, ignorePersonId, name = 'color' }: ColorSwatchPickerProps) {
  const owners = new Map<string, Person>();
  for (const p of people) {
    if (p.id !== ignorePersonId && !owners.has(p.colorId)) owners.set(p.colorId, p);
  }
  const allTaken = owners.size >= PERSON_COLOR_IDS.length;

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Color</legend>
      {allTaken ? <p className={styles.hint}>All colors are in use, so pick any. Names keep everyone apart.</p> : null}
      <div className={styles.grid} role="radiogroup" aria-label="Color">
        {PERSON_COLOR_IDS.map((id) => {
          const owner = owners.get(id);
          const taken = Boolean(owner) && !allTaken;
          const colorName = PERSON_COLOR_NAMES[id];
          const selected = value === id;
          const accessibleName = owner ? `${colorName}, taken by ${owner.name}` : colorName;
          return (
            <label key={id} className={`${styles.tile} ${taken ? styles.taken : ''} ${selected ? styles.selected : ''}`} data-color={id}>
              <input
                type="radio"
                name={name}
                value={id}
                checked={selected}
                disabled={taken}
                onChange={() => onChange(id)}
                className={styles.input}
                aria-label={accessibleName}
              />
              <span className={styles.swatch} aria-hidden="true">
                {selected ? (
                  <Icon icon={Check} size="md" />
                ) : taken && owner ? (
                  <span className={styles.initial}>{owner.name.slice(0, 1).toUpperCase()}</span>
                ) : null}
              </span>
              <span className={styles.caption} aria-hidden="true">
                {owner ? (
                  <>
                    <Icon icon={User} size="sm" />
                    <span className={styles.captionName}>{owner.name}</span>
                  </>
                ) : (
                  colorName
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
