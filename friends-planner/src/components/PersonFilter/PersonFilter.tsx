import { Filter } from 'lucide-react';
import { useData } from '../../state/DataContext';
import { useFilter } from '../../state/FilterContext';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { EmptyState } from '../EmptyState/EmptyState';
import { PersonBadge } from '../PersonBadge/PersonBadge';
import { Sheet } from '../Sheet/Sheet';
import { Users } from 'lucide-react';
import styles from './PersonFilter.module.css';

/** Toolbar button showing "All" or "3 of 10". */
export function FilterButton({ onClick }: { onClick: () => void }) {
  const { isFiltered, shownCount, totalCount } = useFilter();
  const label = isFiltered ? `${shownCount} of ${totalCount}` : 'All';
  const compact = isFiltered ? `${shownCount}/${totalCount}` : 'All';
  return (
    <Button
      size="sm"
      icon={Filter}
      onClick={onClick}
      className={`${styles.filterButton} ${isFiltered ? styles.active : ''}`}
      aria-label={`Filter people: ${isFiltered ? `${shownCount} of ${totalCount}` : 'all'}`}
      aria-haspopup="dialog"
      data-testid="filter-button"
    >
      <span className={styles.full} aria-hidden="true">
        {label}
      </span>
      <span className={styles.compact} aria-hidden="true">
        {compact}
      </span>
    </Button>
  );
}

export function PersonFilter({ onClose }: { onClose: () => void }) {
  const { people } = useData();
  const { isVisible, toggle, showAll, hideAll } = useFilter();
  return (
    <Sheet
      title="Show people"
      onClose={onClose}
      testId="person-filter"
      footer={
        <Button variant="primary" size="lg" block onClick={onClose}>
          Done
        </Button>
      }
    >
      {people.length === 0 ? (
        <EmptyState icon={Users} message="No people yet." />
      ) : (
        <>
          <div className={styles.topRow}>
            <Button size="sm" variant="ghost" onClick={showAll}>
              All
            </Button>
            <Button size="sm" variant="ghost" onClick={hideAll}>
              None
            </Button>
          </div>
          <ul className={styles.list}>
            {people.map((person) => (
              <li key={person.id} className={styles.item}>
                <Checkbox
                  checked={isVisible(person.id)}
                  onChange={() => toggle(person.id)}
                  label={<PersonBadge name={person.name} colorId={person.colorId} variant="row" />}
                  className={styles.row ?? ''}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
