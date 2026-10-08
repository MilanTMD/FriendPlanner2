import { useId, type ChangeEvent, type ReactNode, type Ref } from 'react';
import { describedBy } from '../TextField/describedBy';
import { FieldShell } from '../TextField/TextField';
import styles from './PinInput.module.css';

export interface PinInputProps {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: ReactNode;
  id?: string;
  name?: string;
  autoComplete?: 'off' | 'new-password' | 'current-password';
  disabled?: boolean;
  /** Left-aligned and full width (PersonForm) instead of the centred dialog style. */
  wide?: boolean;
  autoFocusField?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Masked numeric PIN field: digits only, 4-6 of them. */
export function PinInput({
  label,
  value,
  onChange,
  error,
  hint,
  id,
  name,
  autoComplete = 'off',
  disabled,
  wide = false,
  autoFocusField = false,
  ref,
}: PinInputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value.replace(/\D/g, '').slice(0, 6));
  };
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wide ? '' : styles.centered}>
      <input
        ref={ref}
        id={fieldId}
        {...(name ? { name } : {})}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={`${styles.input} ${wide ? styles.wide : ''} ${error ? styles.invalid : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...(autoFocusField ? { 'data-autofocus': '' } : {})}
      />
    </FieldShell>
  );
}
