import React from 'react';
import styles from './Button.module.css';

/**
 * Design System Button
 * - Primary: solid royal (#0B3FBF), white text, 48px high, radius 12
 * - Secondary: white, 1px royal border, royal text, 48px high, radius 12
 * - Tertiary: text link (color royal, no border, transparent)
 */
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
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : Icon ? (
        <Icon size={20} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
