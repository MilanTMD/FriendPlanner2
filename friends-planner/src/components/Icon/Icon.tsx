import type { LucideIcon } from 'lucide-react';

export type IconSize = 'sm' | 'md' | 'lg';

const SIZES: Record<IconSize, string> = {
  sm: 'var(--icon-sm)',
  md: 'var(--icon-md)',
  lg: 'var(--icon-lg)',
};

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  /** When set the icon is a standalone image with this accessible name; otherwise it is decorative. */
  label?: string;
  className?: string;
}

/** Thin wrapper over lucide-react: size from tokens, stroke 2, decorative unless labelled. */
export function Icon({ icon: Glyph, size = 'md', label, className }: IconProps) {
  const px = SIZES[size];
  const common = { width: px, height: px, strokeWidth: 2, className, style: { flex: 'none' } } as const;
  if (label) return <Glyph {...common} role="img" aria-label={label} />;
  return <Glyph {...common} aria-hidden="true" focusable="false" />;
}
