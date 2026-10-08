import { formatDate, parseISODate } from '../../../shared/dates';
import type { ISODate } from '../../../shared/types';
import { columnClass } from './columns';
import styles from './Timeline.module.css';

export function TimelineHeader({
  days,
  today,
  onOpenDay,
}: {
  days: readonly ISODate[];
  today: ISODate;
  onOpenDay: (date: ISODate) => void;
}) {
  return (
    <div className={`${styles.row} ${styles.headRow}`}>
      <div className={`${styles.nameCell} ${styles.corner}`}>
        <span className="sr-only">Person</span>
      </div>
      {days.map((date, i) => {
        const { day } = parseISODate(date);
        const weekdayInitial = formatDate(date, 'weekdayShort').slice(0, 1);
        return (
          <button
            key={date}
            type="button"
            className={`${styles.headCell} ${columnClass(date, today)}`}
            style={{ gridColumn: i + 2 }}
            aria-label={formatDate(date, 'full')}
            data-day-head=""
            data-date={date}
            onClick={() => onOpenDay(date)}
          >
            <span className={styles.weekdayInitial} aria-hidden="true">
              {weekdayInitial}
            </span>
            <span className={`${styles.dayNum} ${date === today ? styles.todayNum : ''}`} aria-hidden="true">
              {day}
            </span>
          </button>
        );
      })}
    </div>
  );
}
