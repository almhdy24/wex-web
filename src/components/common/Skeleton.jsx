import React from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({
  variant = 'text',
  width,
  height,
  borderRadius,
  className = '',
}) {
  const variantClass = styles[variant] || styles.text;

  // Truly dynamic dimension styles when explicit custom string provided
  const dynamicStyle = (width || height || borderRadius) ? {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
  } : undefined;

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={dynamicStyle}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.productCard} aria-hidden="true">
      <Skeleton variant="card" className={styles.productImage} />
      <Skeleton variant="text" className={styles.productSpec} />
      <Skeleton variant="title" className={styles.productTitle} />
      <Skeleton variant="title" className={styles.productPrice} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className={styles.tableSkeleton} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
