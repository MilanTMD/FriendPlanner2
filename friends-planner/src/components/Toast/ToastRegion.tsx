import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast, type ToastItem } from '../../state/ToastContext';
import { Icon } from '../Icon/Icon';
import styles from './Toast.module.css';

const DURATION_MS = 4000;
const ERROR_ACTION_DURATION_MS = 6000;

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.kind === 'error' && item.onAction ? ERROR_ACTION_DURATION_MS : DURATION_MS);

  useEffect(() => {
    if (paused) return undefined;
    const startedAt = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(500, remaining.current - (Date.now() - startedAt));
    };
  }, [paused, onDismiss]);

  return (
    <li
      className={styles.toast}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={item.kind === 'error' ? styles.iconError : styles.iconSuccess}>
        <Icon icon={item.kind === 'error' ? AlertCircle : CheckCircle2} size="md" />
      </span>
      <span className={styles.message}>{item.message}</span>
      {item.actionLabel ? (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            item.onAction?.();
            onDismiss();
          }}
        >
          {item.actionLabel}
        </button>
      ) : null}
    </li>
  );
}

export function ToastRegion() {
  const { toasts, dismiss } = useToast();
  const ref = useRef<HTMLDivElement>(null);

  // Keep the region in the top layer, above any open sheet or dialog. Re-showing it moves it to the
  // end of the top layer, so a toast raised while a dialog is open is still visible.
  const count = toasts.length;
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== 'function') return;
    if (el.matches(':popover-open')) {
      if (count === 0) return;
      el.hidePopover();
    }
    el.showPopover();
  }, [count]);

  return (
    <div ref={ref} popover="manual" className={styles.region} aria-live="polite" aria-atomic="false">
      <ul className={styles.list}>
        {toasts.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </ul>
    </div>
  );
}
