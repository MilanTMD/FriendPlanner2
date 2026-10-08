import type { PersonColorId } from '../../../shared/types';
import styles from './PersonBadge.module.css';

export type PersonBadgeVariant = 'inline' | 'chip' | 'row';

export interface PersonBadgeProps {
  name: string;
  colorId: PersonColorId;
  variant?: PersonBadgeVariant;
  className?: string;
}

/** Color dot plus the name (names are always shown: color is never the only cue). */
export function PersonBadge({ name, colorId, variant = 'inline', className = '' }: PersonBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} data-color={colorId}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.name}>{name}</span>
    </span>
  );
}

export function PersonDot({ colorId, size = 'md' }: { colorId: PersonColorId; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`${styles.dot} ${styles[`dot-${size}`]}`} data-color={colorId} aria-hidden="true" />;
}
