import { weekdayIndexMon0 } from '../../../shared/dates';
import type { ISODate } from '../../../shared/types';
import styles from './Timeline.module.css';

/** Column treatment shared by the header, away row and every person row. */
export function columnClass(date: ISODate, today: ISODate): string {
  const weekday = weekdayIndexMon0(date);
  return [
    date === today ? styles.todayCol : weekday >= 5 ? styles.weekendCol : '',
    weekday === 0 ? styles.mondayCol : '',
  ]
    .filter(Boolean)
    .join(' ');
}
