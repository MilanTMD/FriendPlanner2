import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({ width, height = 16, circle = false, className = '' }: {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  className?: string;
}) {
  const style: CSSProperties = { height, ...(width !== undefined ? { width } : {}) };
  return <span aria-hidden="true" className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className}`} style={style} />;
}
