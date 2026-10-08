import type { KeyboardEvent } from 'react';
import type { ISODate } from '../../../shared/types';
import { weekdayIndexMon0 } from '../../../shared/dates';
import { EventBar } from '../../components/EventBar/EventBar';
import type { DisplayEvent } from '../../lib/useDisplayEvents';
import { layoutWeek } from '../../lib/layout';
import { DayCell } from './DayCell';
import styles from './WeekRow.module.css';

export interface WeekRowProps {
  weekDays: readonly ISODate[];
  monthKey: string;
  events: readonly DisplayEvent[];
  eventsById: ReadonlyMap<string, DisplayEvent>;
  maxLanes: number;
  awayCounts: Record<ISODate, number>;
  today: ISODate;
  highlightId: string | null;
  loading: boolean;
  focusDate: ISODate;
  onOpenDay: (date: ISODate) => void;
  onFocusCell: (date: ISODate) => void;
  onCellKeyDown: (event: KeyboardEvent<HTMLButtonElement>, date: ISODate) => void;
}

/**
 * One Monday-start week. Three layers share one CSS grid:
 * cell backgrounds (z 0), bars (z 1, aria-hidden, no pointer events), day buttons (z 2).
 * The row height is fixed by tokens so loading data never shifts the layout.
 */
export function WeekRow({
  weekDays,
  monthKey,
  events,
  eventsById,
  maxLanes,
  awayCounts,
  today,
  highlightId,
  loading,
  focusDate,
  onOpenDay,
  onFocusCell,
  onCellKeyDown,
}: WeekRowProps) {
  const { segments, hiddenCountByDay } = layoutWeek(weekDays, events, maxLanes);
  return (
    <div className={styles.week} data-testid="week-row" aria-busy={loading || undefined}>
      {weekDays.map((date, col) => {
        const outside = date.slice(0, 7) !== monthKey;
        const weekend = weekdayIndexMon0(date) >= 5;
        return (
          <div
            key={date}
            aria-hidden="true"
            className={[
              styles.bg,
              col > 0 ? styles.bgSep : '',
              outside ? styles.outside : weekend ? styles.weekend : '',
              date === today ? styles.todayBg : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ gridColumn: col + 1 }}
          />
        );
      })}
      {loading ? <div aria-hidden="true" className={styles.shimmer} /> : null}
      <div className={styles.layer} aria-hidden="true">
        {segments.map((segment) => {
          const event = eventsById.get(segment.eventId);
          if (!event) return null;
          return (
            <EventBar
              key={`${segment.eventId}-${segment.segStart}`}
              variant="calendar"
              segment={segment}
              personName={event.personName}
              title={event.title}
              place={event.place}
              startDate={event.startDate}
              endDate={event.endDate}
              highlight={highlightId === segment.eventId}
              gridRow={segment.lane + 2}
            />
          );
        })}
      </div>
      {weekDays.map((date, col) => (
        <DayCell
          key={date}
          date={date}
          column={col}
          outsideMonth={date.slice(0, 7) !== monthKey}
          isToday={date === today}
          awayCount={awayCounts[date] ?? 0}
          hiddenCount={hiddenCountByDay[date] ?? 0}
          tabIndex={date === focusDate ? 0 : -1}
          onOpen={onOpenDay}
          onFocusCell={onFocusCell}
          onKeyDown={onCellKeyDown}
        />
      ))}
    </div>
  );
}
