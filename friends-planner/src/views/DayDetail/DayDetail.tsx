import { ChevronLeft, ChevronRight, EyeOff, Plus, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { addDays, coversDay, formatDate } from '../../../shared/dates';
import type { ISODate } from '../../../shared/types';
import { Button } from '../../components/Button/Button';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { EventListItem } from '../../components/EventListItem/EventListItem';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { PersonBadge } from '../../components/PersonBadge/PersonBadge';
import { Sheet } from '../../components/Sheet/Sheet';
import { useCloseSheet } from '../../lib/nav';
import { useDisplayEvents } from '../../lib/useDisplayEvents';
import { usePageTitle } from '../../lib/usePageTitle';
import { dayPath, newPlanPath, planPath } from '../../routes';
import { useData } from '../../state/DataContext';
import { useFilter } from '../../state/FilterContext';
import { preloadEventForm } from '../../lib/preload';
import styles from './DayDetail.module.css';

const byPersonName = new Intl.Collator('en', { sensitivity: 'base' });

export function DayDetail({ date }: { date: ISODate }) {
  const [, navigate] = useLocation();
  const close = useCloseSheet();
  const { people, status } = useData();
  const { all, visible } = useDisplayEvents();
  const { showAll, isVisible } = useFilter();
  usePageTitle(formatDate(date, 'long'));

  const { shown, hiddenCount, away, around } = useMemo(() => {
    const covering = all.filter((e) => coversDay(e.startDate, e.endDate, date));
    const visibleCovering = visible
      .filter((e) => coversDay(e.startDate, e.endDate, date))
      .sort((a, b) => byPersonName.compare(a.personName, b.personName) || a.id.localeCompare(b.id));
    const awayIds = new Set(visibleCovering.map((e) => e.personId));
    const awayAll = new Set(covering.map((e) => e.personId));
    return {
      shown: visibleCovering,
      hiddenCount: covering.length - visibleCovering.length,
      away: awayIds.size,
      around: people.filter((p) => isVisible(p.id) && !awayAll.has(p.id)),
    };
  }, [all, visible, people, isVisible, date]);

  const summary = away === 0 ? 'Nobody away' : away === 1 ? '1 person away' : `${away} people away`;
  const go = (delta: number) => navigate(dayPath(addDays(date, delta)), { replace: true });

  return (
    <Sheet
      title={formatDate(date, 'full')}
      onClose={close}
      testId="day-detail"
      headerExtra={
        <div className={styles.nav}>
          <IconButton icon={ChevronLeft} label="Previous day" onClick={() => go(-1)} />
          <p className={styles.summary} data-testid="day-summary">
            {summary}
          </p>
          <IconButton icon={ChevronRight} label="Next day" onClick={() => go(1)} />
        </div>
      }
    >
      {hiddenCount > 0 ? (
        <div className={styles.filterNote} data-testid="filter-note">
          <Icon icon={EyeOff} size="sm" />
          <span className={styles.filterText}>
            {hiddenCount} {hiddenCount === 1 ? 'plan' : 'plans'} hidden by filter
          </span>
          <Button variant="link" onClick={showAll}>
            Show all
          </Button>
        </div>
      ) : null}

      {status === 'ready' && shown.length === 0 ? (
        <EmptyState icon={Sun} message="Everyone's around." />
      ) : (
        <ul className={styles.list}>
          {shown.map((event) => (
            <li key={event.id} className={styles.listItem}>
              <EventListItem event={event} day={date} onOpen={(id) => navigate(planPath(id))} />
            </li>
          ))}
        </ul>
      )}

      {status === 'ready' && around.length > 0 && shown.length > 0 ? (
        <section className={styles.around} aria-labelledby="around-heading">
          <h3 id="around-heading" className={styles.aroundHeading}>
            Around ({around.length})
          </h3>
          <ul className={styles.chips}>
            {around.map((person) => (
              <li key={person.id}>
                <PersonBadge name={person.name} colorId={person.colorId} variant="chip" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={styles.action}>
        <Button
          variant="secondary"
          icon={Plus}
          block
          onPointerDown={preloadEventForm}
          onClick={() => navigate(newPlanPath(date))}
        >
          Add plan on this day
        </Button>
      </div>
    </Sheet>
  );
}
