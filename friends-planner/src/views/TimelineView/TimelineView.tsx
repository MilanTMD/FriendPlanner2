import { UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useLocation, useRoute } from 'wouter';
import {
  eachDay,
  firstOfMonth,
  formatMonth,
  isValidMonthKey,
  lastOfMonth,
  todayLocal,
} from '../../../shared/dates';
import { Button } from '../../components/Button/Button';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner';
import { MonthToolbar } from '../../components/MonthToolbar/MonthToolbar';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { awayCountByDay } from '../../lib/layout';
import { usePageTitle } from '../../lib/usePageTitle';
import { useDisplayEvents } from '../../lib/useDisplayEvents';
import { NEW_PERSON_PATH, dayPath, planPath } from '../../routes';
import { useData } from '../../state/DataContext';
import { useFilter } from '../../state/FilterContext';
import { useSession } from '../../state/SessionContext';
import { NotFound } from '../NotFound/NotFound';
import { AwayRow } from './AwayRow';
import { TimelineHeader } from './TimelineHeader';
import { TimelineRow } from './TimelineRow';
import styles from './Timeline.module.css';

export function TimelineView() {
  const [match, params] = useRoute('/timeline/:month');
  const month = match ? (params.month ?? '') : '';
  const valid = isValidMonthKey(month);
  usePageTitle(valid ? `${formatMonth(month)} · Timeline` : 'Page not found');
  if (!valid) return <NotFound />;
  return <TimelineBody month={month} />;
}

function TimelineBody({ month }: { month: string }) {
  const [, navigate] = useLocation();
  const { people, status, error, refetch, highlightId } = useData();
  const { isVisible } = useFilter();
  const { admin, person: acting } = useSession();
  const { visible } = useDisplayEvents();
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayLocal();

  const first = firstOfMonth(month);
  const last = lastOfMonth(month);
  const days = useMemo(() => eachDay(first, last), [first, last]);
  const shown = useMemo(() => people.filter((p) => isVisible(p.id)), [people, isVisible]);
  const awayCounts = useMemo(() => awayCountByDay(visible, days), [visible, days]);
  const eventsByPerson = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const e of visible) {
      const list = map.get(e.personId);
      if (list) list.push(e);
      else map.set(e.personId, [e]);
    }
    return map;
  }, [visible]);

  const loading = status === 'loading' || status === 'idle';

  // Scroll so today is visible (about 2 columns from the left edge). Instant, never smooth.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;
    const todayIndex = days.indexOf(today);
    if (todayIndex < 0) {
      el.scrollLeft = 0;
      return;
    }
    const headCell = el.querySelector<HTMLElement>('[data-day-head]');
    const colWidth = headCell?.offsetWidth ?? 36;
    el.scrollLeft = Math.max(0, (todayIndex - 2) * colWidth);
  }, [month, loading, days, today]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) el.dataset.scrolled = el.scrollLeft > 0 ? 'true' : 'false';
  };

  const gridStyle = { '--tl-days': days.length } as CSSProperties;

  return (
    <div className={styles.page}>
      <MonthToolbar kind="timeline" month={month} />
      {status === 'error' ? (
        <div className={styles.error}>
          <ErrorBanner message={error?.message ?? "Couldn't reach the server. Check your connection."} onRetry={refetch} />
        </div>
      ) : null}
      <div className={styles.frame}>
        <div
          ref={scrollRef}
          className={`${styles.scroll} ${admin ? styles.withBanner : ''}`}
          data-testid="timeline-scroll"
          data-scrolled="false"
          onScroll={onScroll}
          // Keyboard users must be able to scroll this container (axe: scrollable-region-focusable).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role="region"
          aria-label={`Timeline for ${formatMonth(month)}, scrollable`}
        >
          <div className={styles.grid} style={gridStyle} data-testid="timeline" data-month={month} aria-busy={loading || undefined}>
            <TimelineHeader days={days} today={today} onOpenDay={(d) => navigate(dayPath(d))} />
            <AwayRow days={days} today={today} counts={awayCounts} peopleShown={shown.length} loading={loading} />
            {loading
              ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} days={days} today={today} />)
              : shown.map((person) => (
                  <TimelineRow
                    key={person.id}
                    person={person}
                    isYou={acting?.id === person.id}
                    days={days}
                    today={today}
                    events={eventsByPerson.get(person.id) ?? []}
                    highlightId={highlightId}
                    onOpenEvent={(id) => navigate(planPath(id))}
                  />
                ))}
          </div>
          {!loading && people.length === 0 ? (
            <EmptyState icon={Users} message="No people yet">
              <Button variant="primary" icon={UserPlus} onClick={() => navigate(NEW_PERSON_PATH)}>
                Add person
              </Button>
            </EmptyState>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ days, today }: { days: readonly string[]; today: string }) {
  return (
    <div className={styles.row} style={{ gridTemplateRows: 'var(--tl-row-h)' }} aria-hidden="true">
      <div className={styles.nameCell}>
        <Skeleton width={10} height={10} circle />
        <Skeleton width={64} height={12} />
      </div>
      {days.map((d, i) => (
        <div key={d} className={`${styles.bgCell} ${d === today ? styles.todayCol : ''}`} style={{ gridColumn: i + 2 }} />
      ))}
    </div>
  );
}
