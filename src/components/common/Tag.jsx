import React from 'react';
import styles from './Tag.module.css';

export default function Tag({
  children,
  variant = 'neutral',
  icon: Icon,
  className = '',
  ...rest
}) {
  const classes = [styles.tag, styles[variant] || styles.neutral, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {Icon && <Icon size={13} strokeWidth={1.75} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
