import React from 'react';
import styles from './Button.module.css';

// Reusable Button atom with CSS Modules and 44px min touch target
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  className = '',
  onClick,
  ...rest
}) {
  const isCta = variant === 'primary' || variant === 'vivid';

  const classNames = [
    styles.button,
    styles[variant] || styles.primary,
    styles[size] || styles.md,
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {isCta && !disabled && !loading && (
        <span className={styles.sheen} aria-hidden="true" />
      )}
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : Icon ? (
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
