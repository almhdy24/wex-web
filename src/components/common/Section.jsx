import React from 'react';
import styles from './Section.module.css';

/**
 * Shared Design System Section component
 */
export default function Section({
  children,
  title,
  action,
  className = '',
  ...rest
}) {
  return (
    <section className={`${styles.section} ${className}`} {...rest}>
      {(title || action) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
