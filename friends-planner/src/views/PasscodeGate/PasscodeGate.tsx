import { AppMark } from '../../components/AppMark/AppMark';
import { usePageTitle } from '../../lib/usePageTitle';
import { useSession } from '../../state/SessionContext';
import { PasscodeCard } from './PasscodeCard';
import styles from './PasscodeGate.module.css';

const INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Decorative week with three overlapping plan bars: a hint of what the app does. */
function WeekStrip() {
  return (
    <div className={styles.strip} aria-hidden="true">
      {INITIALS.map((letter, i) => (
        <span key={i} className={styles.initial} style={{ gridColumn: i + 1 }}>
          {letter}
        </span>
      ))}
      <span className={`${styles.stripBar} ${styles.stripBar1}`} />
      <span className={`${styles.stripBar} ${styles.stripBar2}`} />
      <span className={`${styles.stripBar} ${styles.stripBar3}`} />
    </div>
  );
}

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
        <WeekStrip />
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
