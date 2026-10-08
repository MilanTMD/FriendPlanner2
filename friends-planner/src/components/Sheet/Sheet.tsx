import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import styles from './Sheet.module.css';

export interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky footer (e.g. the Save button). */
  footer?: ReactNode;
  /** 'sheet' = bottom sheet / side panel, 'dialog' = small centred dialog. */
  variant?: 'sheet' | 'dialog';
  /** Extra header content rendered under the title row (e.g. day navigation). */
  headerExtra?: ReactNode;
  /** Replaces the plain text title (the text is still used as the accessible name). */
  titleContent?: ReactNode;
  testId?: string;
  /** Hide the visible title (dialogs that render their own heading). */
  hideTitle?: boolean;
}

/* ---- focus restoration across nested / replaced sheets ---- */
let openCount = 0;
let rootTrigger: HTMLElement | null = null;

function realActiveElement(): HTMLElement | null {
  const el = document.activeElement;
  return el instanceof HTMLElement && el !== document.body ? el : null;
}

function lockScroll(lock: boolean) {
  document.documentElement.classList.toggle('sheet-open', lock);
}

/**
 * Native <dialog> opened with showModal(): focus trap, Esc to close, top-layer rendering.
 * Bottom sheet below 768px, right-side panel at 768px and wider (CSS).
 */
export function Sheet({ title, onClose, children, footer, variant = 'sheet', headerExtra, titleContent, testId, hideTitle }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const opener = realActiveElement();
    if (openCount === 0 && opener) rootTrigger = opener;
    openCount += 1;
    lockScroll(true);
    if (!dialog.open) dialog.showModal();
    const target = dialog.querySelector<HTMLElement>('[data-autofocus]');
    if (target) target.focus();

    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    // A click on the backdrop targets the <dialog> element itself.
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) onCloseRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onBackdropClick);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onBackdropClick);
      openCount -= 1;
      if (openCount === 0) lockScroll(false);
      queueMicrotask(() => {
        if (openCount > 0) lockScroll(true);
        if (!realActiveElement()) {
          const back = opener?.isConnected ? opener : rootTrigger?.isConnected ? rootTrigger : null;
          back?.focus();
        }
        if (openCount === 0) rootTrigger = null;
      });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${variant === 'dialog' ? styles.centered : styles.sheet}`}
      aria-labelledby={titleId}
      data-testid={testId}
    >
      <div className={styles.panel}>
        {variant === 'sheet' ? <span className={styles.grabber} aria-hidden="true" /> : null}
        <header className={`${styles.header} ${hideTitle ? styles.headerCompact : ''}`}>
          <h2 id={titleId} className={hideTitle ? 'sr-only' : styles.title}>
            {titleContent ?? title}
          </h2>
          {variant === 'sheet' ? <IconButton icon={X} label="Close" onClick={() => onCloseRef.current()} /> : null}
        </header>
        {headerExtra}
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </dialog>
  );
}
