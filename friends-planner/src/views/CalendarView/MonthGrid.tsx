import { CalendarPlus } from 'lucide-react';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation } from 'wouter';
import { addDays, buildMonthWeeks, firstOfMonth, lastOfMonth, todayLocal } from '../../../shared/dates';
import type { ISODate, MonthKey } from '../../../shared/dates';
import { Button } from '../../components/Button/Button';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { preloadEventForm } from '../../lib/preload';
import { awayCountByDay } from '../../lib/layout';
import { useMaxLanes } from '../../lib/useMediaQuery';
import { useDisplayEvents } from '../../lib/useDisplayEvents';
import { dayPath, newPlanPath } from '../../routes';
import { useData } from '../../state/DataContext';
import { WeekRow } from './WeekRow';
import styles from './MonthGrid.module.css';

const WEEKDAYS = [
  ['M', 'Mon', 'Monday'],
  ['T', 'Tue', 'Tuesday'],
  ['W', 'Wed', 'Wednesday'],
  ['T', 'Thu', 'Thursday'],
  ['F', 'Fri', 'Friday'],
  ['S', 'Sat', 'Saturday'],
  ['S', 'Sun', 'Sunday'],
] as const;

export function MonthGrid({ month, loading }: { month: MonthKey; loading: boolean }) {
  const [, navigate] = useLocation();
  const { highlightId, status } = useData();
  const { visible, byId } = useDisplayEvents();
  const maxLanes = useMaxLanes();
  const rootRef = useRef<HTMLDivElement>(null);
  const today = todayLocal();

  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const allDays = useMemo(() => weeks.flat(), [weeks]);
  const awayCounts = useMemo(() => awayCountByDay(visible, allDays), [visible, allDays]);

  const defaultFocus = today.startsWith(month) ? today : firstOfMonth(month);
  const [focusState, setFocusState] = useState<{ month: MonthKey; date: ISODate }>({ month, date: defaultFocus });
  const focusDate = focusState.month === month && allDays.includes(focusState.date) ? focusState.date : defaultFocus;

  const monthStart = firstOfMonth(month);
  const monthEnd = lastOfMonth(month);
  const hasPlansThisMonth = useMemo(
    () => visible.some((e) => e.startDate <= monthEnd && e.endDate >= monthStart),
    [visible, monthStart, monthEnd],
  );
  const showEmpty = status === 'ready' && !hasPlansThisMonth;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: ISODate) => {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    const target = addDays(date, delta);
    if (!allDays.includes(target)) return;
    event.preventDefault();
    setFocusState({ month, date: target });
    rootRef.current?.querySelector<HTMLElement>(`[data-date="${target}"]`)?.focus();
  };

  return (
    <div className={styles.wrap}>
      <div
        ref={rootRef}
        className={styles.grid}
        data-testid="month-grid"
        data-month={month}
        aria-busy={loading || undefined}
        role="group"
        aria-label={`Month grid, ${month}`}
      >
        <div className={styles.weekdays}>
          {WEEKDAYS.map(([initial, short, full], i) => (
            <div key={full} className={`${styles.weekday} ${i >= 5 ? styles.weekdayWeekend : ''}`}>
              <abbr title={full}>
                <span className={styles.initial} aria-hidden="true">
                  {initial}
                </span>
                <span className={styles.shortName} aria-hidden="true">
                  {short}
                </span>
                <span className="sr-only">{full}</span>
              </abbr>
            </div>
          ))}
        </div>
        {weeks.map((weekDays) => (
          <WeekRow
            key={weekDays[0]}
            weekDays={weekDays}
            monthKey={month}
            events={visible}
            eventsById={byId}
            maxLanes={maxLanes}
            awayCounts={awayCounts}
            today={today}
            highlightId={highlightId}
            loading={loading}
            focusDate={focusDate}
            onOpenDay={(date) => navigate(dayPath(date))}
            onFocusCell={(date) => setFocusState({ month, date })}
            onCellKeyDown={onKeyDown}
          />
        ))}
      </div>
      {showEmpty ? (
        <div className={styles.empty}>
          <EmptyState icon={CalendarPlus} variant="card" message="No plans this month yet. Add the first one!">
            <Button
              size="sm"
              variant="primary"
              onPointerDown={preloadEventForm}
              onClick={() => navigate(newPlanPath(today.startsWith(month) ? today : firstOfMonth(month)))}
            >
              Add plan
            </Button>
          </EmptyState>
        </div>
      ) : null}
    </div>
  );
}
