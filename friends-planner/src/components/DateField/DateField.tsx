import type { ComponentProps } from 'react';
import { TextField } from '../TextField/TextField';
import styles from './DateField.module.css';

export type DateFieldProps = Omit<ComponentProps<typeof TextField>, 'type'>;

/** Native date input: its value is already 'YYYY-MM-DD', passed through untouched (never via Date). */
export function DateField({ className = '', ...props }: DateFieldProps) {
  return <TextField {...props} type="date" className={`${styles.date} ${className}`} />;
}
