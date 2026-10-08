import type { KeyboardEvent } from 'react';
import type { ISODate } from '../../../shared/types';
import { formatDate, parseISODate } from '../../../shared/dates';
import styles from './DayCell.module.css';

export interface DayCellProps {
  date: ISODate;
  column: number;
  outsideMonth: boolean;
  isToday: boolean;
  awayCount: number;
  hiddenCount: number;
  tabIndex: 0 | -1;
  onOpen: (date: ISODate) => void;
  onFocusCell: (date: ISODate) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, date: ISODate) => void;
}

function awayLabel(count: number): string {
  if (count === 0) return 'nobody away';
  return count === 1 ? '1 person away' : `${count} people away`;
}

/** A transparent button that covers a whole day cell and opens day detail. */
export function DayCell({
  date,
  column,
  outsideMonth,
  isToday,
  awayCount,
  hiddenCount,
  tabIndex,
  onOpen,
  onFocusCell,
  onKeyDown,
}: DayCellProps) {
  const { day } = parseISODate(date);
  return (
    <button
      type="button"
      className={styles.cell}
      style={{ gridColumn: column + 1 }}
      tabIndex={tabIndex}
      aria-label={`${formatDate(date, 'full')}, ${awayLabel(awayCount)}`}
      data-testid="day-cell"
      data-date={date}
      data-outside-month={outsideMonth ? 'true' : 'false'}
      data-today={isToday ? 'true' : 'false'}
      data-hidden-count={hiddenCount}
      onClick={() => onOpen(date)}
      onFocus={() => onFocusCell(date)}
      onKeyDown={(event) => onKeyDown(event, date)}
    >
      <span className={`${styles.num} ${outsideMonth ? styles.muted : ''} ${isToday ? styles.today : ''}`} aria-hidden="true">
        {day === 1 ? (
          <>
            <span className={styles.firstLong}>{formatDate(date, 'short')}</span>
            <span className={styles.firstShort}>{day}</span>
          </>
        ) : (
          day
        )}
      </span>
      {hiddenCount > 0 ? (
        <span className={styles.more} aria-hidden="true">
          +{hiddenCount}
        </span>
      ) : null}
    </button>
  );
}
