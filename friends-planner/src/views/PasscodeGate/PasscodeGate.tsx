import { AppMark } from '../../components/AppMark/AppMark';
import { usePageTitle } from '../../lib/usePageTitle';
import { useSession } from '../../state/SessionContext';
import { PasscodeCard } from './PasscodeCard';
import styles from './PasscodeGate.module.css';

/** Shown on any route when there is no group session. After login the app stays on the requested URL. */
export function PasscodeGate() {
  const { login } = useSession();
  usePageTitle();
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <AppMark size={48} />
        <h1 className={styles.title}>Friends Plans</h1>
        <p className={styles.tagline}>Who&apos;s away, and when.</p>
        <PasscodeCard
          label="Group passcode"
          submitLabel="Open calendar"
          wrongMessage="That passcode didn't work. Check with the group and try again."
          onSubmit={login}
        />
      </div>
    </main>
  );
}
