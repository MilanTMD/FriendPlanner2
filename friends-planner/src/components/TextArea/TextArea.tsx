import { useId, type ReactNode, type Ref, type TextareaHTMLAttributes } from 'react';
import { describedBy } from '../TextField/describedBy';
import { FieldShell } from '../TextField/TextField';
import styles from './TextArea.module.css';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  id?: string;
  /** Show a "n / max" counter. */
  maxChars?: number;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextArea({ label, hint, error, id, maxChars, className = '', value, ...rest }: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const length = typeof value === 'string' ? value.length : 0;
  const counter =
    maxChars !== undefined ? (
      <span className={`${styles.counter} ${length > maxChars ? styles.over : ''}`} aria-hidden="true">
        {length} / {maxChars}
      </span>
    ) : undefined;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} counter={counter}>
      <textarea
        {...rest}
        value={value}
        id={fieldId}
        className={`${styles.textarea} ${error ? styles.invalid : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
      />
    </FieldShell>
  );
}
