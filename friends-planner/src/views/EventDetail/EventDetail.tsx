import { CalendarDays, CalendarX, Clock, Lock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { formatDuration, formatRange } from '../../../shared/dates';
import { ButtonLink, Button } from '../../components/Button/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Icon } from '../../components/Icon/Icon';
import { Sheet } from '../../components/Sheet/Sheet';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { useCloseSheet } from '../../lib/nav';
import { useDisplayEvents } from '../../lib/useDisplayEvents';
import { usePageTitle } from '../../lib/usePageTitle';
import { editPlanPath } from '../../routes';
import { useData } from '../../state/DataContext';
import { usePinPrompt } from '../../state/PinPromptContext';
import { useSession } from '../../state/SessionContext';
import { useToast } from '../../state/ToastContext';
import { useLastView } from '../../state/LastViewContext';
import styles from './EventDetail.module.css';

export function EventDetail({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const close = useCloseSheet();
  const { lastViewPath } = useLastView();
  const { status, deleteEvent, peopleById } = useData();
  const { all } = useDisplayEvents();
  const { admin, person: acting } = useSession();
  const { ensureActing, runAs } = usePinPrompt();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const event = all.find((e) => e.id === id);
  usePageTitle(event ? event.title : undefined);

  if (!event) {
    return (
      <Sheet title="Plan" onClose={close} testId="event-detail">
        {status === 'ready' || status === 'error' ? (
          <EmptyState icon={CalendarX} message="This plan no longer exists.">
            <ButtonLink href={lastViewPath.split('?')[0] ?? lastViewPath} variant="secondary">
              Back to the calendar
            </ButtonLink>
          </EmptyState>
        ) : (
          <div className={styles.loading} aria-busy="true">
            <Skeleton width="60%" height={20} />
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton width="80%" height={16} />
          </div>
        )}
      </Sheet>
    );
  }

  const owner = peopleById.get(event.personId);
  const locked = !admin && acting?.id !== event.personId;

  const edit = async () => {
    if (!owner) return;
    if (await ensureActing(owner)) navigate(editPlanPath(id));
  };
  const askDelete = async () => {
    if (!owner) return;
    if (await ensureActing(owner)) setConfirming(true);
  };
  const doDelete = async () => {
    if (!owner) return;
    try {
      const done = await runAs(owner, async () => {
        await deleteEvent(id);
        return true;
      });
      if (done) {
        toast('Plan deleted');
        setConfirming(false);
        close();
      }
    } catch {
      toast('Could not delete the plan. Try again.', { kind: 'error' });
    }
  };

  return (
    <>
      <Sheet title="Plan" onClose={close} testId="event-detail">
        <div className={styles.owner}>
          <span className={styles.ownerPill} data-color={event.colorId}>
            {event.personName}
          </span>
        </div>
        <h3 className={styles.title}>{event.title}</h3>
        <ul className={styles.meta}>
          <li>
            <Icon icon={MapPin} size="md" />
            <span>{event.place}</span>
          </li>
          <li>
            <Icon icon={CalendarDays} size="md" />
            <span>{formatRange(event.startDate, event.endDate)}</span>
          </li>
          <li>
            <Icon icon={Clock} size="md" />
            <span>{formatDuration(event.startDate, event.endDate)}</span>
          </li>
        </ul>
        {event.notes ? <p className={styles.notes}>{event.notes}</p> : null}
        <div className={styles.actions}>
          <Button variant="secondary" icon={locked ? Lock : Pencil} block onClick={() => void edit()}>
            Edit
          </Button>
          <Button variant="dangerGhost" icon={locked ? Lock : Trash2} block onClick={() => void askDelete()}>
            Delete
          </Button>
        </div>
        {locked ? <p className={styles.lockHint}>{event.personName}&apos;s PIN needed</p> : null}
      </Sheet>
      {confirming ? (
        <ConfirmDialog
          title={`Delete "${event.title}" (${formatRange(event.startDate, event.endDate)})?`}
          confirmLabel="Delete plan"
          onConfirm={doDelete}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}
