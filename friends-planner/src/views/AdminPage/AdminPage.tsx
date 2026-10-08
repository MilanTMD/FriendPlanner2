import { Download, KeyRound, Trash2, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { isValidPin } from '../../../shared/validation';
import type { Person } from '../../../shared/types';
import { Button } from '../../components/Button/Button';
import { buttonClassName } from '../../components/Button/buttonClass';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Icon } from '../../components/Icon/Icon';
import { PersonDot } from '../../components/PersonBadge/PersonBadge';
import { PinInput } from '../../components/PinInput/PinInput';
import { Sheet } from '../../components/Sheet/Sheet';
import { usePageTitle } from '../../lib/usePageTitle';
import { PasscodeCard } from '../PasscodeGate/PasscodeCard';
import { useData } from '../../state/DataContext';
import { useSession } from '../../state/SessionContext';
import { useToast } from '../../state/ToastContext';
import gate from '../PasscodeGate/PasscodeGate.module.css';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  usePageTitle('Admin');
  const { admin, adminLogin } = useSession();
  if (!admin) {
    return (
      <div className={gate.adminWrap}>
        <div className={gate.adminCard}>
          <h1 className={gate.adminTitle}>Admin</h1>
          <PasscodeCard
            label="Admin passcode"
            submitLabel="Enter admin mode"
            wrongMessage="That admin passcode didn't work."
            onSubmit={adminLogin}
          />
        </div>
      </div>
    );
  }
  return <AdminPanel />;
}

function AdminPanel() {
  const { people, events, status, deletePerson } = useData();
  const { toast } = useToast();
  const [resetting, setResetting] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);

  const planCount = (id: string) => events.filter((e) => e.personId === id).length;

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePerson(deleting.id);
      toast(`${deleting.name} was deleted`);
      setDeleting(null);
    } catch {
      toast('Could not delete the person. Try again.', { kind: 'error' });
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin</h1>
      <h2 className={styles.subtitle}>People</h2>
      <div className={styles.card}>
        {status === 'ready' && people.length === 0 ? (
          <EmptyState icon={Users} message="No people yet." />
        ) : (
          <ul>
            {people.map((person) => (
              <li key={person.id} className={styles.row} data-testid="admin-person-row" data-person-id={person.id}>
                <div className={styles.info}>
                  <PersonDot colorId={person.colorId} size="lg" />
                  <span className={styles.name}>{person.name}</span>
                </div>
                <div className={styles.actions}>
                  <Button size="sm" icon={KeyRound} onClick={() => setResetting(person)} aria-label={`Reset PIN: ${person.name}`}>
                    Reset PIN
                  </Button>
                  <Button size="sm" variant="dangerGhost" icon={Trash2} onClick={() => setDeleting(person)} aria-label={`Delete person: ${person.name}`}>
                    Delete person
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className={styles.backup}>
        <a href="/api/admin/export" download className={buttonClassName({ variant: 'secondary' })}>
          <Icon icon={Download} size="sm" />
          <span>&nbsp;Download backup (JSON)</span>
        </a>
      </p>

      {resetting ? <ResetPinDialog person={resetting} onClose={() => setResetting(null)} /> : null}
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${deleting.name} and their ${planCount(deleting.id)} ${planCount(deleting.id) === 1 ? 'plan' : 'plans'}?`}
          confirmLabel="Delete person"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}

function ResetPinDialog({ person, onClose }: { person: Person; onClose: () => void }) {
  const { resetPin } = useData();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ pin?: string; confirm?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found: typeof errors = {};
    if (!isValidPin(pin)) found.pin = 'Use 4–6 digits.';
    else if (confirm !== pin) found.confirm = "PINs don't match.";
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setBusy(true);
    try {
      await resetPin(person.id, pin);
      toast(`PIN reset for ${person.name}`);
      onClose();
    } catch {
      setErrors({ form: 'Could not reset the PIN. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      variant="dialog"
      title={`Reset ${person.name}'s PIN`}
      onClose={onClose}
      testId="reset-pin-dialog"
      footer={
        <div className={styles.dialogActions}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reset-pin-form" variant="primary" loading={busy}>
            Reset PIN
          </Button>
        </div>
      }
    >
      <form id="reset-pin-form" className={styles.resetForm} onSubmit={(e) => void submit(e)} noValidate>
        <PinInput label="New PIN" value={pin} onChange={setPin} error={errors.pin} autoComplete="new-password" autoFocusField />
        <PinInput label="Confirm new PIN" value={confirm} onChange={setConfirm} error={errors.confirm ?? errors.form} autoComplete="new-password" />
      </form>
    </Sheet>
  );
}
