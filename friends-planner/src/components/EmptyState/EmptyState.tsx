import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './EmptyState.module.css';

export function EmptyState({
  icon,
  message,
  children,
  variant = 'block',
  className = '',
}: {
  icon: LucideIcon;
  message: ReactNode;
  children?: ReactNode;
  variant?: 'block' | 'card';
  className?: string;
}) {
  return (
    <div className={`${styles.root} ${variant === 'card' ? styles.card : styles.block} ${className}`}>
      <span className={styles.icon}>
        <Icon icon={icon} size="lg" />
      </span>
      <p className={styles.message}>{message}</p>
      {children}
    </div>
  );
}
