import React from 'react';
import { Info } from 'lucide-react';
import styles from './NoticeLine.module.css';

/**
 * Design System NoticeLine
 * - Plain text line with a small info icon (16px, stroke 1.75), no box.
 */
export default function NoticeLine({
  children,
  icon: Icon = Info,
  variant = 'secondary',
  className = '',
  ...rest
}) {
  return (
    <div className={`${styles.noticeLine} ${styles[variant] || styles.secondary} ${className}`} {...rest}>
      <Icon size={16} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
      <span className={styles.text}>{children}</span>
    </div>
  );
}
