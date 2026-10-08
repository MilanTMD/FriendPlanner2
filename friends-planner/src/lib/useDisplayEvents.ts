import { useMemo } from 'react';
import type { PlanEvent } from '../../shared/types';
import { useData } from '../state/DataContext';
import { useFilter } from '../state/FilterContext';
import type { LayoutEvent } from './layout';

export interface DisplayEvent extends LayoutEvent {
  title: string;
  place: string;
  notes: string;
}

function toDisplay(event: PlanEvent, name: string, colorId: LayoutEvent['colorId']): DisplayEvent {
  return {
    id: event.id,
    personId: event.personId,
    personName: name,
    colorId,
    startDate: event.startDate,
    endDate: event.endDate,
    title: event.title,
    place: event.place,
    notes: event.notes,
  };
}

export interface DisplayEvents {
  /** Events of people who pass the person filter. */
  visible: DisplayEvent[];
  /** All events (any person), for "hidden by filter" counts. */
  all: DisplayEvent[];
  byId: ReadonlyMap<string, DisplayEvent>;
}

/** Joins events with their owners and applies the person filter. Orphaned events are skipped. */
export function useDisplayEvents(): DisplayEvents {
  const { events, peopleById } = useData();
  const { hidden } = useFilter();
  return useMemo(() => {
    const all: DisplayEvent[] = [];
    for (const event of events) {
      const person = peopleById.get(event.personId);
      if (person) all.push(toDisplay(event, person.name, person.colorId));
    }
    const visible = all.filter((e) => !hidden.has(e.personId));
    return { all, visible, byId: new Map(all.map((e) => [e.id, e])) };
  }, [events, peopleById, hidden]);
}
