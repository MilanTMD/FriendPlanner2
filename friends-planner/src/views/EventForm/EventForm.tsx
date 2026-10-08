import { CalendarX, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useSearch } from 'wouter';
import { isValidISODate, todayLocal } from '../../../shared/dates';
import type { ISODate, PlanEvent } from '../../../shared/types';
import { LIMITS, validateEventInput } from '../../../shared/validation';
import { ApiError } from '../../api/client';
import { Button } from '../../components/Button/Button';
import { DateField } from '../../components/DateField/DateField';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner';
import { PersonBadge } from '../../components/PersonBadge/PersonBadge';
import { Sheet } from '../../components/Sheet/Sheet';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { TextArea } from '../../components/TextArea/TextArea';
import { TextField } from '../../components/TextField/TextField';
import { useCloseSheet } from '../../lib/nav';
import { usePageTitle } from '../../lib/usePageTitle';
import { NEW_PERSON_PATH } from '../../routes';
import { useData } from '../../state/DataContext';
import { usePinPrompt } from '../../state/PinPromptContext';
import { useSession } from '../../state/SessionContext';
import { useToast } from '../../state/ToastContext';
import styles from './EventForm.module.css';

interface FieldErrors {
  personId?: string;
  title?: string;
  place?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  form?: string;
}

/** Create ("/plans/new") or edit ("/plans/:id/edit") a plan. */
export default function EventForm({ id }: { id?: string }) {
  const editing = id !== undefined;
  const { events, status } = useData();
  const close = useCloseSheet();
  usePageTitle(editing ? 'Edit plan' : 'Add plan');
  const existing = editing ? events.find((e) => e.id === id) : undefined;

  if (editing && !existing) {
    return (
      <Sheet title="Edit plan" onClose={close} testId="event-form">
        {status === 'ready' || status === 'error' ? (
          <EmptyState icon={CalendarX} message="This plan no longer exists." />
        ) : (
          <div className={styles.loading} aria-busy="true">
            <Skeleton width="60%" height={20} />
            <Skeleton height={16} />
            <Skeleton height={16} />
          </div>
        )}
      </Sheet>
    );
  }
  return <EventFormBody existing={existing} />;
}

function EventFormBody({ existing }: { existing: PlanEvent | undefined }) {
  const editing = existing !== undefined;
  const close = useCloseSheet();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { people, peopleById, createEvent, updateEvent } = useData();
  const { admin, person: acting } = useSession();
  const { ensureActing, runAs } = usePinPrompt();
  const { toast } = useToast();

  const dateParam = new URLSearchParams(search).get('date');
  const defaultStart: ISODate = existing?.startDate ?? (dateParam && isValidISODate(dateParam) ? dateParam : todayLocal());

  const [personId, setPersonId] = useState<string>(existing?.personId ?? acting?.id ?? '');
  const [changingWho, setChangingWho] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [place, setPlace] = useState(existing?.place ?? '');
  const [startDate, setStartDate] = useState<ISODate>(defaultStart);
  const [endDate, setEndDate] = useState<ISODate>(existing?.endDate ?? defaultStart);
  const [endTouched, setEndTouched] = useState(editing);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const owner = peopleById.get(personId);
  const showPicker = !editing && (!owner || changingWho);

  const clear = (key: keyof FieldErrors) => setErrors((cur) => (cur[key] ? { ...cur, [key]: undefined } : cur));

  const changeStart = (value: ISODate) => {
    setStartDate(value);
    clear('startDate');
    // "To" follows "From" until the user sets it, and is never earlier than "From".
    if (!endTouched || (isValidISODate(value) && endDate < value)) {
      setEndDate(value);
      clear('endDate');
    }
  };

  const choosePerson = async (id: string) => {
    const person = peopleById.get(id);
    if (!person) return;
    clear('personId');
    if (admin || acting?.id === person.id) {
      setPersonId(id);
      setChangingWho(false);
      return;
    }
    if (await ensureActing(person)) {
      setPersonId(id);
      setChangingWho(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const checked = validateEventInput({ title, place, startDate, endDate, notes });
    const found: FieldErrors = {};
    if (!owner) found.personId = 'Choose who this plan is for.';
    if (!checked.ok) {
      const f = checked.fields;
      if (f.title) found.title = f.title;
      if (f.place) found.place = f.place;
      if (f.startDate) found.startDate = f.startDate;
      if (f.endDate) found.endDate = f.endDate;
      if (f.notes) found.notes = f.notes;
    }
    if (Object.keys(found).length > 0 || !checked.ok || !owner) {
      setErrors(found);
      const firstKey = (['personId', 'title', 'place', 'startDate', 'endDate', 'notes'] as const).find((k) => found[k]);
      if (firstKey) {
        const target = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
        target?.focus();
      }
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const saved = await runAs(owner, () =>
        existing ? updateEvent(existing.id, checked.value) : createEvent({ personId: owner.id, ...checked.value }),
      );
      if (!saved) return; // PIN prompt cancelled
      toast(existing ? 'Plan saved' : 'Plan added');
      close();
    } catch (caught) {
      if (caught instanceof ApiError) {
        const f = caught.fields;
        const mapped: FieldErrors = {
          ...(f.personId ? { personId: f.personId } : {}),
          ...(f.title ? { title: f.title } : {}),
          ...(f.place ? { place: f.place } : {}),
          ...(f.startDate ? { startDate: f.startDate } : {}),
          ...(f.endDate ? { endDate: f.endDate } : {}),
          ...(f.notes ? { notes: f.notes } : {}),
        };
        if (Object.keys(mapped).length === 0) mapped.form = caught.message;
        setErrors(mapped);
      } else {
        setErrors({ form: 'Something went wrong. Try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const goNewPerson = () => {
    const here = search ? `${location}?${search}` : location;
    navigate(`${NEW_PERSON_PATH}?next=${encodeURIComponent(here)}`);
  };

  return (
    <Sheet
      title={editing ? 'Edit plan' : 'Add plan'}
      onClose={close}
      testId="event-form"
      footer={
        <Button type="submit" form="event-form" variant="primary" size="lg" block loading={busy}>
          Save plan
        </Button>
      }
    >
      <form id="event-form" className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
        {errors.form ? <ErrorBanner message={errors.form} /> : null}

        <div className={styles.who}>
          {showPicker ? (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Who</legend>
              {people.length > 0 ? (
                <div className={styles.radios} role="radiogroup" aria-label="Who">
                  {people.map((p, index) => (
                    <label key={p.id} className={styles.radioRow}>
                      <input
                        type="radio"
                        name="who"
                        value={p.id}
                        checked={personId === p.id}
                        onChange={() => void choosePerson(p.id)}
                        className={styles.radioInput}
                        data-field={index === 0 ? 'personId' : undefined}
                      />
                      <span className={styles.radioMark} aria-hidden="true" />
                      <PersonBadge name={p.name} colorId={p.colorId} variant="row" />
                    </label>
                  ))}
                </div>
              ) : null}
              <Button size="sm" variant="secondary" icon={UserPlus} onClick={goNewPerson} className={styles.newHere ?? ''}>
                I&apos;m new here
              </Button>
              {errors.personId ? (
                <p className={styles.groupError} role="alert">
                  {errors.personId}
                </p>
              ) : null}
            </fieldset>
          ) : owner ? (
            <div className={styles.whoSet}>
              <span className={styles.whoLabel}>Who</span>
              <PersonBadge name={owner.name} colorId={owner.colorId} variant="chip" />
              {!editing ? (
                <Button variant="link" onClick={() => setChangingWho(true)}>
                  Change
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <TextField
          label="Plan"
          placeholder="e.g. Ski trip"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clear('title');
          }}
          error={errors.title}
          maxLength={LIMITS.titleMax + 20}
          enterKeyHint="next"
          autoComplete="off"
          data-autofocus=""
          data-field="title"
        />
        <TextField
          label="Place"
          placeholder="e.g. Prague"
          value={place}
          onChange={(e) => {
            setPlace(e.target.value);
            clear('place');
          }}
          error={errors.place}
          maxLength={LIMITS.placeMax + 20}
          enterKeyHint="next"
          autoComplete="off"
          data-field="place"
        />
        <div className={styles.dates}>
          <DateField
            label="From"
            value={startDate}
            onChange={(e) => changeStart(e.target.value)}
            error={errors.startDate}
            data-field="startDate"
            required
          />
          <DateField
            label="To (last day)"
            value={endDate}
            min={startDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setEndTouched(true);
              clear('endDate');
            }}
            error={errors.endDate}
            data-field="endDate"
            required
          />
        </div>
        <TextArea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            clear('notes');
          }}
          error={errors.notes}
          maxChars={LIMITS.notesMax}
          data-field="notes"
        />
      </form>
    </Sheet>
  );
}
