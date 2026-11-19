import React from 'react';
import { PackageOpen } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'لا توجد بيانات',
  description,
  action,
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.iconBox} aria-hidden="true">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
