import { isValidISODate, toMonthKey } from '../../shared/dates';
import { calendarPath } from '../routes';

/** Where a sheet route opens "over": the last calendar/timeline, People, or a page of its own. */
export function baseFor(path: string, search: string, lastViewPath: string, hasRealView: boolean): string {
  const lastView = lastViewPath.split('?')[0] ?? lastViewPath;
  const day = /^\/day\/([^/]+)$/.exec(path);
  if (day) {
    const date = day[1] ?? '';
    if (!isValidISODate(date)) return path;
    return hasRealView ? lastView : calendarPath(toMonthKey(date));
  }
  if (path === '/plans/new' || /^\/plans\/[^/]+(\/edit)?$/.test(path)) return lastView;
  if (path === '/people/new') return new URLSearchParams(search).get('next') ? lastView : '/people';
  if (/^\/people\/[^/]+\/edit$/.test(path)) return '/people';
  return path;
}
