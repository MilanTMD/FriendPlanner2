import { Plus } from 'lucide-react';
import { Link } from 'wouter';
import { preloadEventForm } from '../../lib/preload';
import { newPlanPath } from '../../routes';
import { Icon } from '../Icon/Icon';
import styles from './Fab.module.css';

export function Fab() {
  return (
    <Link
      href={newPlanPath()}
      className={styles.fab}
      aria-label="Add plan"
      data-testid="fab"
      onPointerDown={preloadEventForm}
      onFocus={preloadEventForm}
    >
      <Icon icon={Plus} size="lg" />
      <span className={styles.text}>Add plan</span>
    </Link>
  );
}
