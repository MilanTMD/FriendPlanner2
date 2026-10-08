import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useData } from './DataContext';

const STORAGE_KEY = 'fp.filter.v1';

interface FilterValue {
  /** Ids of people hidden by the filter. New people are visible by default. */
  hidden: ReadonlySet<string>;
  isVisible: (personId: string) => boolean;
  /** Number of people currently shown / total people. */
  shownCount: number;
  totalCount: number;
  isFiltered: boolean;
  toggle: (personId: string) => void;
  showAll: () => void;
  hideAll: () => void;
}

const FilterContext = createContext<FilterValue | null>(null);

function readHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { hidden?: unknown };
    if (Array.isArray(parsed.hidden)) return new Set(parsed.hidden.filter((x): x is string => typeof x === 'string'));
  } catch {
    /* ignore corrupt storage */
  }
  return new Set();
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { people } = useData();
  const [hidden, setHidden] = useState<Set<string>>(readHidden);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ hidden: [...hidden] }));
    } catch {
      /* storage unavailable */
    }
  }, [hidden]);

  const isVisible = useCallback((id: string) => !hidden.has(id), [hidden]);
  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const showAll = useCallback(() => setHidden(new Set()), []);
  const hideAll = useCallback(() => setHidden(new Set(people.map((p) => p.id))), [people]);

  const value = useMemo<FilterValue>(() => {
    const total = people.length;
    const shown = people.filter((p) => !hidden.has(p.id)).length;
    return {
      hidden,
      isVisible,
      shownCount: shown,
      totalCount: total,
      isFiltered: total > 0 && shown !== total,
      toggle,
      showAll,
      hideAll,
    };
  }, [hidden, people, isVisible, toggle, showAll, hideAll]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter(): FilterValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilter must be used inside FilterProvider');
  return ctx;
}
