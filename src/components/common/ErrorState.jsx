import React from 'react';
import Button from './Button';

export default function ErrorState({
  title = 'حدث خطأ في تحميل البيانات',
  message = 'تعذر الاتصال بالخادم أو حدث خطأ غير متوقع. يرجى إعادة المحاولة.',
  onRetry
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-4)',
        textAlign: 'center',
        background: 'var(--color-danger-bg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-danger-border)',
        margin: 'var(--space-4) 0'
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }} aria-hidden="true">
        ⚠️
      </div>
      <h3 style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ maxWidth: '440px', color: 'var(--color-slate-700)', marginBottom: onRetry ? 'var(--space-4)' : 0 }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
