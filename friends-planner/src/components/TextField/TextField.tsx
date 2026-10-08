import { AlertCircle } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Icon } from '../Icon/Icon';
import { describedBy } from './describedBy';
import styles from './TextField.module.css';

export interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
  counter?: ReactNode;
  className?: string;
}

/** Label, control slot, hint and error message. Shared by TextField, DateField and TextArea. */
export function FieldShell({ id, label, hint, error, children, counter, className = '' }: FieldShellProps) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {hint || counter ? (
        <div className={styles.metaRow}>
          {hint ? (
            <p id={`${id}-hint`} className={styles.hint}>
              {hint}
            </p>
          ) : (
            <span />
          )}
          {counter}
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          <Icon icon={AlertCircle} size="sm" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  id?: string;
  ref?: Ref<HTMLInputElement>;
  fieldClassName?: string;
}

export function TextField({ label, hint, error, id, fieldClassName, className = '', ...input }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={fieldClassName ?? ''}>
      <input
        {...input}
        id={fieldId}
        className={`${styles.input} ${error ? styles.invalid : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
      />
    </FieldShell>
  );
}
