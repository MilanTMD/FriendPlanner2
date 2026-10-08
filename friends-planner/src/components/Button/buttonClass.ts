import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

export function buttonClassName({ variant = 'secondary', size = 'md', block = false, className = '' }: ButtonStyleProps): string {
  return [styles.button, styles[variant], styles[size], block ? styles.block : '', className].filter(Boolean).join(' ');
}
