import { ChevronRight, Lock, ShieldCheck, UserX, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'wouter';
import { ADMIN_PATH, PEOPLE_PATH } from '../../routes';
import { useSession } from '../../state/SessionContext';
import { useTheme, type ThemePreference } from '../../state/ThemeContext';
import { useToast } from '../../state/ToastContext';
import { Icon } from '../Icon/Icon';
import { PersonBadge } from '../PersonBadge/PersonBadge';
import { SegmentedRadios } from '../SegmentedControl/SegmentedControl';
import { Sheet } from '../Sheet/Sheet';
import styles from './MenuSheet.module.css';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function NavRow({ href, icon, label, onNavigate }: { href: string; icon: LucideIcon; label: string; onNavigate: () => void }) {
  return (
    <li>
      <Link href={href} className={styles.row} onClick={onNavigate}>
        <Icon icon={icon} size="md" />
        <span className={styles.label}>{label}</span>
        <Icon icon={ChevronRight} size="md" />
      </Link>
    </li>
  );
}

export function MenuSheet({ onClose }: { onClose: () => void }) {
  const { person, forgetPerson, logout } = useSession();
  const { preference, setPreference } = useTheme();
  const { toast } = useToast();

  const forget = async () => {
    try {
      await forgetPerson();
      toast('This device no longer acts as anyone');
      onClose();
    } catch {
      toast('Could not forget this device. Try again.', { kind: 'error' });
    }
  };

  const lock = async () => {
    onClose();
    await logout();
  };

  return (
    <Sheet title="Menu" onClose={onClose} testId="menu-sheet">
      {person ? (
        <div className={styles.identity}>
          <PersonBadge name={person.name} colorId={person.colorId} variant="row" />
          <p className={styles.identityHint}>This device acts as {person.name}</p>
        </div>
      ) : null}
      <ul className={styles.list}>
        <NavRow href={PEOPLE_PATH} icon={Users} label="People" onNavigate={onClose} />
        <NavRow href={ADMIN_PATH} icon={ShieldCheck} label="Admin" onNavigate={onClose} />
        <li className={styles.themeRow}>
          <SegmentedRadios legend="Theme" options={THEME_OPTIONS} value={preference} onChange={setPreference} />
        </li>
        {person ? (
          <li>
            <button type="button" className={styles.row} onClick={() => void forget()}>
              <Icon icon={UserX} size="md" />
              <span className={styles.label}>Forget me on this device</span>
            </button>
          </li>
        ) : null}
        <li>
          <button type="button" className={`${styles.row} ${styles.danger}`} onClick={() => void lock()}>
            <Icon icon={Lock} size="md" />
            <span className={styles.label}>Lock calendar</span>
          </button>
        </li>
      </ul>
    </Sheet>
  );
}
