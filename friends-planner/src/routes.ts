import type { ISODate, MonthKey } from '../shared/dates';

export const calendarPath = (month: MonthKey): string => `/calendar/${month}`;
export const timelinePath = (month: MonthKey): string => `/timeline/${month}`;
export const dayPath = (date: ISODate): string => `/day/${date}`;
export const newPlanPath = (date?: ISODate): string => (date ? `/plans/new?date=${date}` : '/plans/new');
export const planPath = (id: string): string => `/plans/${id}`;
export const editPlanPath = (id: string): string => `/plans/${id}/edit`;
export const PEOPLE_PATH = '/people';
export const NEW_PERSON_PATH = '/people/new';
export const editPersonPath = (id: string): string => `/people/${id}/edit`;
export const ADMIN_PATH = '/admin';

/** True for paths that render a month page (the base layer sheets open over). */
export function isViewPath(path: string): boolean {
  return /^\/(calendar|timeline)\/[^/]+/.test(path);
}
