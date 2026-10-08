import { useState, type FormEvent } from 'react';
import { useSearch } from 'wouter';
import { firstUnusedColor } from '../../../shared/colors';
import type { Person, PersonColorId } from '../../../shared/types';
import { isValidPin, validateName } from '../../../shared/validation';
import { ApiError } from '../../api/client';
import { Button } from '../../components/Button/Button';
import { Checkbox } from '../../components/Checkbox/Checkbox';
import { ColorSwatchPicker } from '../../components/ColorSwatchPicker/ColorSwatchPicker';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner';
import { PinInput } from '../../components/PinInput/PinInput';
import { Sheet } from '../../components/Sheet/Sheet';
import { TextField } from '../../components/TextField/TextField';
import { previousEntryIsApp, appNavigate, useCloseSheet } from '../../lib/nav';
import { usePageTitle } from '../../lib/usePageTitle';
import { useData } from '../../state/DataContext';
import { usePinPrompt } from '../../state/PinPromptContext';
import { useSession } from '../../state/SessionContext';
import { useToast } from '../../state/ToastContext';
import { UserX } from 'lucide-react';
import styles from './PersonForm.module.css';

interface Errors {
  name?: string;
  colorId?: string;
  pin?: string;
  confirm?: string;
  form?: string;
}

/** Create (no id) or edit (name and color only) a person. */
export default function PersonForm({ id }: { id?: string }) {
  const editing = id !== undefined;
  usePageTitle(editing ? 'Edit person' : 'Add person');
  const close = useCloseSheet();
  const { peopleById, status } = useData();
  const existing = editing ? peopleById.get(id) : undefined;

  if (editing && !existing) {
    return (
      <Sheet title="Edit person" onClose={close} testId="person-form">
        {status === 'ready' || status === 'error' ? (
          <EmptyState icon={UserX} message="This person no longer exists." />
        ) : null}
      </Sheet>
    );
  }
  return <PersonFormBody existing={existing} />;
}

function PersonFormBody({ existing }: { existing: Person | undefined }) {
  const editing = existing !== undefined;
  const id = existing?.id;
  const close = useCloseSheet();
  const search = useSearch();
  const next = new URLSearchParams(search).get('next');
  const { people, createPerson, updatePerson } = useData();
  const { setActingPerson } = useSession();
  const { runAs } = usePinPrompt();
  const { toast } = useToast();

  const [name, setName] = useState(existing?.name ?? '');
  const [colorId, setColorId] = useState<PersonColorId>(existing?.colorId ?? firstUnusedColor(people.map((p) => p.colorId)));
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const finish = () => {
    if (next) {
      if (previousEntryIsApp()) window.history.back();
      else appNavigate(next, { replace: true });
    } else {
      close();
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found: Errors = {};
    const checkedName = validateName(name);
    if (!checkedName.ok) found.name = checkedName.message;
    if (!editing) {
      if (!isValidPin(pin)) found.pin = 'Use 4–6 digits.';
      else if (confirmPin !== pin) found.confirm = "PINs don't match.";
    }
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      if (editing && existing) {
        const updated = await runAs(existing, () => updatePerson(existing.id, { name, colorId }));
        if (!updated) return;
        toast('Person saved');
        close();
      } else {
        const created = await createPerson({ name, colorId, pin, remember });
        setActingPerson(created);
        toast(`You're now acting as ${created.name}`);
        finish();
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        const fields = caught.fields;
        if (caught.code === 'NAME_TAKEN') setErrors({ name: 'That name is taken.' });
        else if (Object.keys(fields).length > 0) {
          setErrors({
            ...(fields.name ? { name: fields.name } : {}),
            ...(fields.colorId ? { colorId: fields.colorId } : {}),
            ...(fields.pin ? { pin: fields.pin } : {}),
          });
        } else setErrors({ form: caught.message });
      } else {
        setErrors({ form: 'Something went wrong. Try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={editing ? 'Edit person' : 'Add person'}
      onClose={close}
      testId="person-form"
      footer={
        <Button type="submit" form="person-form" variant="primary" size="lg" block loading={busy}>
          Save person
        </Button>
      }
    >
      <form id="person-form" className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
        {errors.form ? <ErrorBanner message={errors.form} /> : null}
        <TextField
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((cur) => ({ ...cur, name: undefined }));
          }}
          error={errors.name}
          autoCapitalize="words"
          autoComplete="off"
          maxLength={40}
          data-autofocus=""
        />
        <ColorSwatchPicker value={colorId} onChange={setColorId} people={people} ignorePersonId={id ?? ''} />
        {!editing ? (
          <>
            <PinInput
              label="PIN"
              value={pin}
              onChange={(v) => {
                setPin(v);
                if (errors.pin) setErrors((cur) => ({ ...cur, pin: undefined }));
              }}
              error={errors.pin}
              hint="4–6 digits. You'll need it to change or delete your plans. Forgot it? The admin can reset it."
              autoComplete="new-password"
              wide
            />
            <PinInput
              label="Confirm PIN"
              value={confirmPin}
              onChange={(v) => {
                setConfirmPin(v);
                if (errors.confirm) setErrors((cur) => ({ ...cur, confirm: undefined }));
              }}
              error={errors.confirm}
              autoComplete="new-password"
              wide
            />
            <Checkbox label="Remember me on this device" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          </>
        ) : null}
      </form>
    </Sheet>
  );
}
