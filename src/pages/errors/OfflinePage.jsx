import React from 'react';
import Button from '../../components/common/Button';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className="container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-4)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-slate-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-slate-500)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 style={{ marginBottom: 'var(--space-2)', fontSize: '24px', color: 'var(--color-navy)' }}>
        لا يوجد اتصال بالإنترنت
      </h1>
      <p style={{ maxWidth: 460, color: 'var(--color-slate-600)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
        يبدو أنك غير متصل بالإنترنت حالياً. يتطلب متجر ويكس تكنولوجي اتصالاً بالشبكة لتحديث أسعار الصرف وحجز الأجهزة وإتمام عمليات الدفع.
      </p>
      <Button variant="primary" onClick={handleReload}>
        إعادة محاولة الاتصال
      </Button>
    </div>
  );
}
