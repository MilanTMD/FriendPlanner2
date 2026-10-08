import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { Link } from 'wouter';
import { Icon } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonClass';
import styles from './Button.module.css';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

export interface ButtonProps extends StyleProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  loading?: boolean;
  icon?: LucideIcon;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  block,
  className,
  loading = false,
  icon,
  children,
  type = 'button',
  onClick,
  disabled,
  ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      className={buttonClassName({ variant, size, block: block ?? false, className: className ?? '' })}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-loading={loading || undefined}
      onClick={handleClick}
    >
      <span className={styles.label}>
        {icon ? <Icon icon={icon} size={size === 'lg' ? 'md' : 'sm'} /> : null}
        {children}
      </span>
      {loading ? (
        <span className={styles.spinner}>
          <Spinner />
        </span>
      ) : null}
    </button>
  );
}

export interface ButtonLinkProps extends StyleProps {
  href: string;
  replace?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
}

/** An <a href> styled like a Button (real links stay crawlable and keyboard friendly). */
export function ButtonLink({ href, replace, icon, children, ...style }: ButtonLinkProps) {
  return (
    <Link href={href} {...(replace ? { replace: true } : {})} className={buttonClassName(style)}>
      <span className={styles.label}>
        {icon ? <Icon icon={icon} size="sm" /> : null}
        {children}
      </span>
    </Link>
  );
}
