import type { ISODate } from '../../../shared/types';
import { columnClass } from './columns';
import styles from './Timeline.module.css';

function levelClass(count: number, total: number): string {
  if (count <= 0 || total <= 0) return '';
  const share = count / total;
  if (share > 0.5) return styles.away3 ?? '';
  if (share > 0.25) return styles.away2 ?? '';
  return styles.away1 ?? '';
}

/** Distinct people away per day: the clearest overlap signal. */
export function AwayRow({
  days,
  today,
  counts,
  peopleShown,
  loading,
}: {
  days: readonly ISODate[];
  today: ISODate;
  counts: Record<ISODate, number>;
  peopleShown: number;
  loading: boolean;
}) {
  return (
    <div className={`${styles.row} ${styles.awayRow}`} data-testid="away-row">
      <div className={`${styles.nameCell} ${styles.awayLabel}`}>Away</div>
      {days.map((date, i) => {
        const count = loading ? 0 : (counts[date] ?? 0);
        return (
          <div
            key={date}
            className={`${styles.awayCell} ${columnClass(date, today)} ${levelClass(count, peopleShown)}`}
            style={{ gridColumn: i + 2 }}
            data-testid="away-cell"
            data-date={date}
            data-count={count}
            aria-label={`${count} away on ${date}`}
          >
            <span aria-hidden="true">{count > 0 ? count : '–'}</span>
          </div>
        );
      })}
    </div>
  );
}
