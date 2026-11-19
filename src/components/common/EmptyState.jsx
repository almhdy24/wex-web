import React from 'react';
import Button from './Button';

export default function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم نتمكن من العثور على أي نتائج في هذا القسم حالياً.',
  icon = '📦',
  actionLabel,
  onAction
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        textAlign: 'center',
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-slate-300)',
        margin: 'var(--space-4) 0'
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }} aria-hidden="true">
        {icon}
      </div>
      <h3 style={{ marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ maxWidth: '420px', color: 'var(--color-slate-500)', marginBottom: actionLabel ? 'var(--space-5)' : 0 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
