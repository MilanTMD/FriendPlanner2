import { Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Person } from '../../../shared/types';
import { isValidPin } from '../../../shared/validation';
import { ApiError, api } from '../../api/client';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Icon } from '../Icon/Icon';
import { PersonBadge } from '../PersonBadge/PersonBadge';
import { PinInput } from '../PinInput/PinInput';
import { Sheet } from '../Sheet/Sheet';
import styles from './PinDialog.module.css';

export interface PinDialogProps {
  person: Person;
  /** Called after the server accepted the PIN (the device now acts as this person). */
  onVerified: (person: Person) => void;
  onCancel: () => void;
}

function lockMessage(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many tries. Try again in ${minutes} min or ask the admin to reset your PIN.`;
}

export function PinDialog({ person, onVerified, onCancel }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [lockedFor, setLockedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || lockedFor !== null) return;
    if (!isValidPin(pin)) {
      setError('Use 4–6 digits.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const { person: verified } = await api.verifyPin(person.id, pin, remember);
      onVerified(verified);
    } catch (caught) {
      setPin('');
      if (caught instanceof ApiError) {
        if (caught.isLocked && caught.retryAfterSeconds !== undefined) {
          setLockedFor(caught.retryAfterSeconds);
        } else if (caught.code === 'PIN_INVALID') {
          const left = caught.remainingAttempts ?? 0;
          setError(`Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left before a short lock.`);
        } else if (caught.code === 'NETWORK') {
          setError("Couldn't reach the server. Check your connection.");
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

  const locked = lockedFor !== null;
  return (
    <Sheet
      variant="dialog"
      title={`Enter ${person.name}'s PIN`}
      onClose={onCancel}
      testId="pin-dialog"
    >
      <form onSubmit={(e) => void submit(e)} className={styles.form} noValidate>
        <div className={styles.badge}>
          <PersonBadge name={person.name} colorId={person.colorId} variant="chip" />
        </div>
        <PinInput
          label="PIN"
          value={pin}
          onChange={(v) => {
            setPin(v);
            if (error) setError(undefined);
          }}
          error={locked ? undefined : error}
          disabled={locked}
          autoFocusField
        />
        {locked ? (
          <p role="status" className={styles.lock}>
            <Icon icon={Clock} size="sm" />
            <span>{lockMessage(lockedFor)}</span>
          </p>
        ) : null}
        <Checkbox label="Remember me on this device" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <Button type="submit" variant="primary" size="lg" block loading={busy} disabled={locked}>
          Continue
        </Button>
        <Button variant="ghost" block onClick={onCancel}>
          Cancel
        </Button>
      </form>
    </Sheet>
  );
}
