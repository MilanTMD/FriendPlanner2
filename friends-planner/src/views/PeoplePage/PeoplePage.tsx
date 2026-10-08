import { Pencil, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { todayLocal } from '../../../shared/dates';
import { Button } from '../../components/Button/Button';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner';
import { PersonDot } from '../../components/PersonBadge/PersonBadge';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { usePageTitle } from '../../lib/usePageTitle';
import { NEW_PERSON_PATH, editPersonPath } from '../../routes';
import { useData } from '../../state/DataContext';
import { usePinPrompt } from '../../state/PinPromptContext';
import { useSession } from '../../state/SessionContext';
import { useToast } from '../../state/ToastContext';
import styles from './PeoplePage.module.css';

export default function PeoplePage() {
  usePageTitle('People');
  const [, navigate] = useLocation();
  const { people, events, status, error, refetch } = useData();
  const { person: acting, admin, forgetPerson } = useSession();
  const { requestPin } = usePinPrompt();
  const { toast } = useToast();
  const today = todayLocal();

  const upcoming = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.endDate >= today) counts.set(e.personId, (counts.get(e.personId) ?? 0) + 1);
    }
    return counts;
  }, [events, today]);

  const loading = status === 'loading' || status === 'idle';

  const forget = async () => {
    try {
      await forgetPerson();
      toast('This device no longer acts as anyone');
    } catch {
      toast('Could not forget this device. Try again.', { kind: 'error' });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>People</h1>
        <Button variant="primary" icon={UserPlus} onClick={() => navigate(NEW_PERSON_PATH)} className={styles.add ?? ''}>
          Add person
        </Button>
      </div>

      {status === 'error' ? (
        <ErrorBanner message={error?.message ?? "Couldn't reach the server. Check your connection."} onRetry={refetch} className={styles.error ?? ''} />
      ) : null}

      <div className={styles.card}>
        {loading ? (
          <ul aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={styles.row}>
                <div className={styles.skeletonRow}>
                  <Skeleton width={14} height={14} circle />
                  <Skeleton width={140} height={16} />
                </div>
              </li>
            ))}
          </ul>
        ) : people.length === 0 ? (
          <EmptyState icon={Users} message="No people yet. Add yourself first.">
            <Button variant="primary" icon={UserPlus} onClick={() => navigate(NEW_PERSON_PATH)}>
              Add person
            </Button>
          </EmptyState>
        ) : (
          <ul>
            {people.map((person) => {
              const isYou = acting?.id === person.id;
              const count = upcoming.get(person.id) ?? 0;
              return (
                <li key={person.id} className={styles.row} data-testid="person-row" data-person-id={person.id}>
                  <div className={styles.info}>
                    <div className={styles.nameLine}>
                      <PersonDot colorId={person.colorId} size="lg" />
                      <span className={styles.name}>{person.name}</span>
                      {isYou ? <span className={styles.you}>You</span> : null}
                    </div>
                    <p className={styles.count}>
                      {count} upcoming {count === 1 ? 'plan' : 'plans'}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    {!isYou ? (
                      <Button size="sm" onClick={() => void requestPin(person)} aria-label={`This is me: ${person.name}`}>
                        This is me
                      </Button>
                    ) : null}
                    {isYou || admin ? (
                      <Button size="sm" variant="ghost" icon={Pencil} onClick={() => navigate(editPersonPath(person.id))} aria-label={`Edit ${person.name}`}>
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {acting ? (
        <p className={styles.forget}>
          <Button variant="link" onClick={() => void forget()}>
            Forget me on this device
          </Button>
        </p>
      ) : null}
    </div>
  );
}
