import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { todayLocal, toMonthKey } from '../../../shared/dates';
import { calendarPath } from '../../routes';
import { useSession } from '../../state/SessionContext';
import { ActingAsChip } from '../ActingAsChip/ActingAsChip';
import { AdminBanner } from '../AdminBanner/AdminBanner';
import { AppMark } from '../AppMark/AppMark';
import { IconButton } from '../IconButton/IconButton';
import { MenuSheet } from '../MenuSheet/MenuSheet';
import { PersonPicker } from '../PersonPicker/PersonPicker';
import { ViewSwitch } from '../ViewSwitch/ViewSwitch';
import styles from './Header.module.css';

export function Header() {
  const { person, admin } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className={styles.sticky}>
      <header className={styles.header}>
        <div className={styles.row}>
          <Link href={calendarPath(toMonthKey(todayLocal()))} className={styles.brand} aria-label="Friends Plans, this month's calendar">
            <AppMark size={24} />
            <span className={styles.brandName}>Friends Plans</span>
          </Link>
          <ViewSwitch />
          <div className={styles.spacer} />
          <ActingAsChip person={person} admin={admin} onClick={() => setPickerOpen(true)} />
          <IconButton icon={Menu} label="Menu" aria-haspopup="dialog" onClick={() => setMenuOpen(true)} />
        </div>
      </header>
      {admin ? <AdminBanner /> : null}
      {menuOpen ? <MenuSheet onClose={() => setMenuOpen(false)} /> : null}
      {pickerOpen ? <PersonPicker onClose={() => setPickerOpen(false)} /> : null}
    </div>
  );
}
