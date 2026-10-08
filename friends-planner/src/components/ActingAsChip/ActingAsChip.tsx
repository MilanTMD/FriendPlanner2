import { ShieldCheck } from 'lucide-react';
import type { Person } from '../../../shared/types';
import { Icon } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './ActingAsChip.module.css';

export function ActingAsChip({
  person,
  admin,
  loading = false,
  onClick,
}: {
  person: Person | null;
  admin: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  if (loading) return <Skeleton width={88} height={36} className={styles.skeleton ?? ''} />;
  const label = person ? `Acting as ${person.name}. Change` : 'Who are you?';
  return (
    <button
      type="button"
      className={styles.chip}
      onClick={onClick}
      aria-label={label}
      aria-haspopup="dialog"
      data-testid="acting-as"
      data-person-id={person?.id ?? ''}
      {...(person ? { 'data-color': person.colorId } : {})}
    >
      <span className={styles.visual}>
        <span className={person ? styles.dot : styles.emptyDot} aria-hidden="true" />
        <span className={styles.name}>{person ? person.name : 'Who are you?'}</span>
        {admin ? (
          <span className={styles.shield}>
            <Icon icon={ShieldCheck} size="sm" />
          </span>
        ) : null}
      </span>
    </button>
  );
}
