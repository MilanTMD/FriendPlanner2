import { todayLocal, toMonthKey } from '../../../shared/dates';
import { AppMark } from '../../components/AppMark/AppMark';
import { ButtonLink } from '../../components/Button/Button';
import { usePageTitle } from '../../lib/usePageTitle';
import { calendarPath } from '../../routes';
import styles from './NotFound.module.css';

export function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className={styles.page}>
      <AppMark size={48} />
      <h1 className={styles.title}>This page wandered off.</h1>
      <ButtonLink variant="primary" size="lg" href={calendarPath(toMonthKey(todayLocal()))}>
        Back to the calendar
      </ButtonLink>
    </div>
  );
}
