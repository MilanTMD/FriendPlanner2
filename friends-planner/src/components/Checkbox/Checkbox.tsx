import { Check } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode;
  id?: string;
}

/** Native checkbox, restyled. The whole row is a 44px target. */
export function Checkbox({ label, id, className = '', ...input }: CheckboxProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label htmlFor={fieldId} className={`${styles.row} ${className}`}>
      <input {...input} id={fieldId} type="checkbox" className={styles.input} />
      <span className={styles.box} aria-hidden="true">
        <Icon icon={Check} size="sm" />
      </span>
      <span className={styles.text}>{label}</span>
    </label>
  );
}
