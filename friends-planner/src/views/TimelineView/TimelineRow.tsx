import type { CSSProperties } from 'react';
import type { ISODate, Person } from '../../../shared/types';
import { EventBar } from '../../components/EventBar/EventBar';
import { PersonDot } from '../../components/PersonBadge/PersonBadge';
import { layoutTimelineRow } from '../../lib/layout';
import type { DisplayEvent } from '../../lib/useDisplayEvents';
import { columnClass } from './columns';
import styles from './Timeline.module.css';

/** "pad  bar  (gap bar)*  pad": explicit tracks so every lane has a fixed height. */
function rowTemplate(laneCount: number): string {
  const lanes = laneCount > 1 ? ` repeat(${laneCount - 1}, var(--tl-lane-gap) var(--tl-bar-h))` : '';
  return `var(--tl-row-pad) var(--tl-bar-h)${lanes} var(--tl-row-pad)`;
}

export function TimelineRow({
  person,
  isYou,
  days,
  today,
  events,
  highlightId,
  onOpenEvent,
}: {
  person: Person;
  isYou: boolean;
  days: readonly ISODate[];
  today: ISODate;
  events: readonly DisplayEvent[];
  highlightId: string | null;
  onOpenEvent: (eventId: string) => void;
}) {
  const first = days[0] ?? '';
  const last = days[days.length - 1] ?? '';
  const { segments, laneCount } = layoutTimelineRow(events, first, last);
  const byId = new Map(events.map((e) => [e.id, e]));
  const style: CSSProperties = { gridTemplateRows: rowTemplate(laneCount) };
  return (
    <div className={styles.row} style={style} data-testid="timeline-row" data-person-id={person.id} role="group" aria-label={person.name}>
      <div className={styles.nameCell} data-color={person.colorId}>
        <PersonDot colorId={person.colorId} size="sm" />
        <span className={styles.nameText}>
          <span className={styles.nameLine}>{person.name}</span>
          {isYou ? <span className={styles.you}>You</span> : null}
        </span>
      </div>
      {days.map((date, i) => (
        <div key={date} className={`${styles.bgCell} ${columnClass(date, today)}`} style={{ gridColumn: i + 2 }} aria-hidden="true" />
      ))}
      {segments.map((segment) => {
        const event = byId.get(segment.eventId);
        if (!event) return null;
        return (
          <EventBar
            key={`${segment.eventId}-${segment.segStart}`}
            variant="timeline"
            segment={segment}
            personName={person.name}
            title={event.title}
            place={event.place}
            startDate={event.startDate}
            endDate={event.endDate}
            highlight={highlightId === segment.eventId}
            gridRow={2 + segment.lane * 2}
            columnOffset={2}
            onOpen={onOpenEvent}
          />
        );
      })}
    </div>
  );
}
