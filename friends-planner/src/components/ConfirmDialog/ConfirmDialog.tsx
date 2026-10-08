import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Sheet } from '../Sheet/Sheet';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

/** Destructive confirmation. "Keep it" gets initial focus as the safe default. */
export function ConfirmDialog({ title, message = "This can't be undone.", confirmLabel, cancelLabel = 'Keep it', onConfirm, onCancel }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      variant="dialog"
      title={title}
      onClose={onCancel}
      testId="confirm-dialog"
      footer={
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} data-autofocus="">
            {cancelLabel}
          </Button>
          <Button variant="danger" loading={busy} onClick={() => void confirm()}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.icon}>
        <Icon icon={AlertTriangle} size="lg" />
      </div>
      <p className={styles.message}>{message}</p>
    </Sheet>
  );
}
