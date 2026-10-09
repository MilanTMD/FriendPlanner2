import { useLocation, useSearch } from 'wouter';
import { isValidMonthKey, todayLocal, toMonthKey } from '../../shared/dates';
import type { MonthKey } from '../../shared/dates';
import { useLastView } from '../state/LastViewContext';
import { baseFor } from './baseFor';

export type ViewKind = 'calendar' | 'timeline';

export interface ActiveView {
  kind: ViewKind;
  month: MonthKey;
  /** True when the current (base) page is the calendar or timeline. */
  isView: boolean;
}

const VIEW_RE = /^\/(calendar|timeline)\/([^/?#]+)/;

function parse(path: string): { kind: ViewKind; month: MonthKey } | null {
  const m = VIEW_RE.exec(path);
  if (!m) return null;
  const month = m[2] ?? '';
  if (!isValidMonthKey(month)) return null;
  return { kind: m[1] as ViewKind, month };
}

/** The calendar/timeline view and month currently shown (or last shown, when on another page). */
export function useActiveView(): ActiveView {
  const [path] = useLocation();
  const search = useSearch();
  const { lastViewPath, hasRealView } = useLastView();
  const direct = parse(path);
  if (direct) return { ...direct, isView: true };
  // On a sheet route (/day, /plans, ...) the view underneath is the active one.
  const underneath = parse(baseFor(path, search, lastViewPath, hasRealView));
  if (underneath) return { ...underneath, isView: true };
  const last = parse(lastViewPath);
  if (last) return { ...last, isView: false };
  return { kind: 'calendar', month: toMonthKey(todayLocal()), isView: false };
}
