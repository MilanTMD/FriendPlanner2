import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearch } from 'wouter';
import { todayLocal, toMonthKey } from '../../shared/dates';
import { calendarPath, isViewPath } from '../routes';

interface LastViewValue {
  /** The last calendar/timeline path (with search), used when closing a sheet with no history to go back to. */
  lastViewPath: string;
  /** False until a real calendar/timeline page has been shown (the value is then just the current month). */
  hasRealView: boolean;
}

const LastViewContext = createContext<LastViewValue | null>(null);

export function LastViewProvider({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const search = useSearch();
  const [state, setState] = useState<LastViewValue>(() => ({
    lastViewPath: calendarPath(toMonthKey(todayLocal())),
    hasRealView: false,
  }));

  // Derived while rendering (no effect, no lag): remember the latest calendar/timeline location.
  if (isViewPath(path)) {
    const current = search ? `${path}?${search}` : path;
    if (state.lastViewPath !== current || !state.hasRealView) {
      setState({ lastViewPath: current, hasRealView: true });
    }
  }

  const value = useMemo(() => state, [state]);
  return <LastViewContext.Provider value={value}>{children}</LastViewContext.Provider>;
}

export function useLastView(): LastViewValue {
  const ctx = useContext(LastViewContext);
  if (!ctx) throw new Error('useLastView must be used inside LastViewProvider');
  return ctx;
}
