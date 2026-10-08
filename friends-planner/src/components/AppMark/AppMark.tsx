/** The app mark: a rounded square with three staggered plan bars (DESIGN.md section 8.3). */
export function AppMark({ size = 24 }: { size?: 24 | 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--color-mark-bg)" />
      <rect x="6" y="8" width="20" height="4.5" rx="2.25" fill="#F59A2E" />
      <rect x="6" y="14" width="12" height="4.5" rx="2.25" fill="#5CB8F0" />
      <rect x="12" y="20" width="14" height="4.5" rx="2.25" fill="#E98AC4" />
    </svg>
  );
}
