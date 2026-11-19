import React from 'react';

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <Skeleton height="180px" borderRadius="var(--radius-md)" style={{ marginBottom: 'var(--space-3)' }} />
      <Skeleton width="40%" height="14px" style={{ marginBottom: 'var(--space-2)' }} />
      <Skeleton width="90%" height="20px" style={{ marginBottom: 'var(--space-2)' }} />
      <Skeleton width="60%" height="14px" style={{ marginBottom: 'var(--space-4)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="45%" height="24px" />
        <Skeleton width="35%" height="36px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container" style={{ padding: 'var(--space-4)' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-slate-100)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${100 / cols}%`} height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
}
