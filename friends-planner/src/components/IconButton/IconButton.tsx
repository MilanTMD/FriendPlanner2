import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, Ref } from 'react';
import { Link } from 'wouter';
import { Icon } from '../Icon/Icon';
import styles from './IconButton.module.css';

interface Common {
  icon: LucideIcon;
  /** Required: icon-only controls need an accessible name. */
  label: string;
  compact?: boolean;
  className?: string;
}

export interface IconButtonProps extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'aria-label'> {
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ icon, label, compact = false, className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button {...rest} type={type} aria-label={label} className={`${styles.iconButton} ${compact ? styles.compact : ''} ${className}`}>
      <Icon icon={icon} size="md" />
    </button>
  );
}

export function IconLink({ icon, label, compact = false, className = '', href }: Common & { href: string }) {
  return (
    <Link href={href} aria-label={label} className={`${styles.iconButton} ${compact ? styles.compact : ''} ${className}`}>
      <Icon icon={icon} size="md" />
    </Link>
  );
}
