import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { addMonths, formatMonth, todayLocal, toMonthKey } from '../../../shared/dates';
import type { MonthKey } from '../../../shared/dates';
import { ButtonLink } from '../Button/Button';
import { IconLink } from '../IconButton/IconButton';
import { FilterButton, PersonFilter } from '../PersonFilter/PersonFilter';
import type { ViewKind } from '../../lib/useActiveView';
import { calendarPath, timelinePath } from '../../routes';
import styles from './MonthToolbar.module.css';

export function MonthToolbar({ kind, month }: { kind: ViewKind; month: MonthKey }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const pathFor = kind === 'calendar' ? calendarPath : timelinePath;
  const todayMonth = toMonthKey(todayLocal());
  return (
    <div className={styles.toolbar}>
      <h1 className={styles.title} data-testid="month-title" aria-label={formatMonth(month)}>
        <span className={styles.long}>{formatMonth(month)}</span>
        <span className={styles.short}>{formatMonth(month, true)}</span>
      </h1>
      <div className={styles.actions}>
        <IconLink icon={ChevronLeft} label="Previous month" href={pathFor(addMonths(month, -1))} compact />
        <ButtonLink size="sm" variant="secondary" href={pathFor(todayMonth)} className={styles.today ?? ''}>
          Today
        </ButtonLink>
        <IconLink icon={ChevronRight} label="Next month" href={pathFor(addMonths(month, 1))} compact />
        <FilterButton onClick={() => setFilterOpen(true)} />
      </div>
      {filterOpen ? <PersonFilter onClose={() => setFilterOpen(false)} /> : null}
    </div>
  );
}
