import { useId, type ReactNode } from 'react';
import { Link } from 'wouter';
import styles from './SegmentedControl.module.css';

/** Track for link segments (ViewSwitch). */
export function SegmentedNav({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={`${styles.track} ${className}`}>
      {children}
    </nav>
  );
}

export function SegmentLink({ href, current, children }: { href: string; current: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={styles.segment} {...(current ? { 'aria-current': 'page' as const } : {})}>
      {children}
    </Link>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

/** Radio-group variant (Theme). */
export function SegmentedRadios<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.track} role="radiogroup" aria-label={legend}>
        {options.map((option) => (
          <label key={option.value} className={styles.radio}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className={styles.radioInput}
            />
            <span className={styles.segment}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
