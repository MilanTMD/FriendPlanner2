import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '../../state/SessionContext';
import { useToast } from '../../state/ToastContext';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import styles from './AdminBanner.module.css';

export function AdminBanner() {
  const { adminLogout } = useSession();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const exit = async () => {
    setBusy(true);
    try {
      await adminLogout();
      toast('Admin mode ended');
    } catch {
      toast('Could not exit admin mode. Try again.', { kind: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div role="status" className={styles.banner} data-testid="admin-banner">
      <div className={styles.inner}>
        <span className={styles.icon}>
          <Icon icon={ShieldCheck} size="sm" />
        </span>
        <p className={styles.text}>
          <span className={styles.short}>Admin mode</span>
          <span className={styles.long}>Admin mode: you can edit or delete any plan.</span>
        </p>
        <Button size="sm" variant="ghost" loading={busy} onClick={() => void exit()}>
          Exit admin mode
        </Button>
      </div>
    </div>
  );
}
