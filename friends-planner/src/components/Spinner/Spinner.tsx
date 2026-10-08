import styles from './Spinner.module.css';

export function Spinner({ size = 16, label }: { size?: 16 | 20 | 24; label?: string }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}
