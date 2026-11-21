import React from 'react';
import styles from './Page.module.css';

/**
 * Shared Design System Page container
 * Enforces side padding (16px), top spacing, bottom padding (tab bar + safe area)
 * and the data-page-container marker.
 */
export default function Page({
  children,
  className = '',
  as: Component = 'main',
  padded = true,
  ...rest
}) {
  const classes = [
    styles.page,
    padded ? styles.padded : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      data-page-container="true"
      className={classes}
      {...rest}
    >
      {children}
    </Component>
  );
}
