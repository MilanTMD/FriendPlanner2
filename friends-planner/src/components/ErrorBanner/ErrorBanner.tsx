import { AlertTriangle, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import styles from './ErrorBanner.module.css';

export function ErrorBanner({
  message,
  onRetry,
  className = '',
}: {
  message: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
}) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };
  return (
    <div role="alert" className={`${styles.banner} ${className}`}>
      <span className={styles.icon}>
        <Icon icon={AlertTriangle} size="md" />
      </span>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <Button size="sm" icon={RotateCw} loading={retrying} onClick={() => void retry()}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
