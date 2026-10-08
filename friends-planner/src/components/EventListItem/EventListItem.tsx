import { ChevronRight, MapPin } from 'lucide-react';
import { formatPosition, formatRangeShort } from '../../../shared/dates';
import type { DisplayEvent } from '../../lib/useDisplayEvents';
import { Icon } from '../Icon/Icon';
import { PersonBadge } from '../PersonBadge/PersonBadge';
import styles from './EventListItem.module.css';

/** A plan row (day detail). The whole row is a button that opens the plan. */
export function EventListItem({ event, day, onOpen }: { event: DisplayEvent; day: string; onOpen: (id: string) => void }) {
  const range = formatRangeShort(event.startDate, event.endDate);
  const position = event.startDate === event.endDate ? '' : ` · ${formatPosition(day, event.startDate, event.endDate)}`;
  return (
    <button
      type="button"
      className={styles.item}
      data-testid="day-event"
      data-event-id={event.id}
      data-color={event.colorId}
      onClick={() => onOpen(event.id)}
    >
      <span className={styles.content}>
        <span className={styles.person}>
          <PersonBadge name={event.personName} colorId={event.colorId} variant="row" className={styles.personName ?? ''} />
        </span>
        <span className={styles.title}>{event.title}</span>
        <span className={styles.place}>
          <Icon icon={MapPin} size="sm" />
          <span className={styles.placeText}>{event.place}</span>
        </span>
        <span className={styles.range}>
          {range}
          {position}
        </span>
        {event.notes ? <span className={styles.notes}>{event.notes}</span> : null}
      </span>
      <span className={styles.chevron}>
        <Icon icon={ChevronRight} size="md" />
      </span>
    </button>
  );
}
