import { Clock } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../../api/client';
import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { TextField } from '../../components/TextField/TextField';
import styles from './PasscodeGate.module.css';

export interface PasscodeCardProps {
  label: string;
  submitLabel: string;
  /** Called with the typed passcode; should throw ApiError on failure. */
  onSubmit: (passcode: string) => Promise<void>;
  wrongMessage: string;
  children?: ReactNode;
}

/** Passcode field + submit with the gate states: inline error, lockout box, loading. */
export function PasscodeCard({ label, submitLabel, onSubmit, wrongMessage, children }: PasscodeCardProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [lockedMinutes, setLockedMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || lockedMinutes !== null) return;
    if (value.length === 0) {
      setError('Enter the passcode.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await onSubmit(value);
    } catch (caught) {
      setValue('');
      if (caught instanceof ApiError) {
        if (caught.isLocked && caught.retryAfterSeconds !== undefined) {
          setLockedMinutes(Math.max(1, Math.ceil(caught.retryAfterSeconds / 60)));
        } else if (caught.code === 'PASSCODE_INVALID') {
          setError(wrongMessage);
        } else if (caught.code === 'NETWORK') {
          setError("Couldn't reach the server. Check your connection.");
        } else if (caught.code === 'MISCONFIGURED') {
          setError('The server is not configured yet. Ask whoever set up the site.');
        } else {
          setError(caught.message);
        }
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const locked = lockedMinutes !== null;
  return (
    <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
      <TextField
        label={label}
        type="password"
        name="passcode"
        autoComplete="current-password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(undefined);
        }}
        error={locked ? undefined : error}
        disabled={locked}
      />
      {locked ? (
        <p role="status" className={styles.lock}>
          <Icon icon={Clock} size="sm" />
          <span>Too many tries. Try again in {lockedMinutes} min.</span>
        </p>
      ) : null}
      {children}
      <Button type="submit" variant="primary" size="lg" block loading={busy} disabled={locked}>
        {submitLabel}
      </Button>
    </form>
  );
}
