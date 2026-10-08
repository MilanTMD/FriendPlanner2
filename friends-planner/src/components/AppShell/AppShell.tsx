import type { ReactNode } from 'react';
import { Fab } from '../Fab/Fab';
import { Header } from '../Header/Header';
import styles from './AppShell.module.css';

/** Chrome around every authenticated view: skip link, sticky header, main landmark, FAB. */
export function AppShell({ children, showFab }: { children: ReactNode; showFab: boolean }) {
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
      {showFab ? <Fab /> : null}
    </div>
  );
}
