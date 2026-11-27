import React from 'react';
import styles from './DarkCard.module.css';

/**
 * Design System DarkCard
 * - Navy (#111833) surface, text uses --on-dark (#FFFFFF) and --on-dark-muted (#C9D6F5)
 * - Radius 16, 1px border (#111833), no shadow
 * - Max ONE dark card per screen
 * - Optional gradient (royal to navy) for payment amount card
 */
export default function DarkCard({
  children,
  gradient = false,
  padding = 'md',
  className = '',
  ...rest
}) {
  const paddingClass = {
    none: styles.paddingNone,
    sm: styles.paddingSm,
    md: styles.paddingMd,
    lg: styles.paddingLg,
  }[padding] || styles.paddingMd;

  const classes = [
    styles.darkCard,
    gradient ? styles.gradient : styles.navy,
    paddingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
