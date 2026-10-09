import type { CSSProperties } from 'react';
import { formatRange } from '../../../shared/dates';
import type { Segment } from '../../lib/layout';
import styles from './EventBar.module.css';

export interface EventBarProps {
  segment: Segment;
  personName: string;
  title: string;
  place: string;
  /** Full inclusive range of the event, for the accessible name. */
  startDate: string;
  endDate: string;
  highlight: boolean;
  variant: 'calendar' | 'timeline';
  /** Grid row for this bar (calendar: lane + 2, timeline: derived from lane). */
  gridRow: number;
  /** First grid column of the day area (timeline has the name column first). */
  columnOffset?: number;
  onOpen?: (eventId: string) => void;
}

function classes(segment: Segment, variant: 'calendar' | 'timeline'): string {
  return [
    styles.bar,
    variant === 'calendar' ? styles.calendar : styles.timeline,
    segment.continuesBefore ? styles.before : '',
    segment.continuesAfter ? styles.after : '',
    segment.span === 1 ? styles.single : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** One bar segment. The calendar variant is decorative (aria-hidden layer); the timeline variant is a button. */
export function EventBar({
  segment,
  personName,
  title,
  place,
  startDate,
  endDate,
  highlight,
  variant,
  gridRow,
  columnOffset = 1,
  onOpen,
}: EventBarProps) {
  const style: CSSProperties = {
    gridColumn: `${segment.startCol + columnOffset} / span ${segment.span}`,
    gridRow,
  };
  const hooks = {
    'data-event-id': segment.eventId,
    'data-person-id': segment.personId,
    'data-seg-start': segment.segStart,
    'data-seg-end': segment.segEnd,
    'data-lane': segment.lane,
    'data-continues-before': segment.continuesBefore ? 'true' : 'false',
    'data-continues-after': segment.continuesAfter ? 'true' : 'false',
    'data-color': segment.colorId,
    'data-highlight': highlight ? 'true' : undefined,
  };

  if (variant === 'calendar') {
    return (
      <div className={classes(segment, variant)} style={style} data-testid="event-bar" {...hooks}>
        <span className={styles.label}>
          <span className={styles.name}>{personName}</span>
          <span className={styles.title}> {'·'} {title}</span>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classes(segment, variant)}
      style={style}
      data-testid="timeline-bar"
      title={title}
      aria-label={`${personName}: ${title}, ${place}, ${formatRange(startDate, endDate)}`}
      onClick={() => onOpen?.(segment.eventId)}
      {...hooks}
    >
      <span className={styles.label}>{title}</span>
    </button>
  );
}
