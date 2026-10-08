import { useLocation, useRoute } from 'wouter';
import { formatMonth, isValidMonthKey } from '../../../shared/dates';
import { ErrorBanner } from '../../components/ErrorBanner/ErrorBanner';
import { MonthToolbar } from '../../components/MonthToolbar/MonthToolbar';
import { usePageTitle } from '../../lib/usePageTitle';
import { useData } from '../../state/DataContext';
import { NotFound } from '../NotFound/NotFound';
import { MonthGrid } from './MonthGrid';
import styles from './CalendarView.module.css';

export function CalendarView() {
  const [match, params] = useRoute('/calendar/:month');
  const month = match ? (params.month ?? '') : '';
  const valid = isValidMonthKey(month);
  usePageTitle(valid ? `${formatMonth(month)} · Calendar` : 'Page not found');
  const { status, error, refetch } = useData();
  const [location] = useLocation();
  if (!valid) return <NotFound key={location} />;

  return (
    <div className={styles.page}>
      <MonthToolbar kind="calendar" month={month} />
      {status === 'error' ? (
        <div className={styles.error}>
          <ErrorBanner message={error?.message ?? "Couldn't reach the server. Check your connection."} onRetry={refetch} />
        </div>
      ) : null}
      <MonthGrid month={month} loading={status === 'loading' || status === 'idle'} />
    </div>
  );
}
