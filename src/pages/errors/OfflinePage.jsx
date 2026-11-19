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
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-3)' }}>
        📶❌
      </div>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>لا يوجد اتصال بالإنترنت</h1>
      <p style={{ maxWidth: 460, color: 'var(--color-slate-600)', marginBottom: 'var(--space-6)' }}>
        يبدو أنك غير متصل بالإنترنت حالياً. يتطلب متجر ويكس تكنولوجي اتصالاً بالشبكة لعرض أحدث الأسعار وحجز الأجهزة وتقديم الطلبات.
      </p>
      <Button variant="primary" onClick={handleReload}>
        🔄 إعادة محاولة الاتصال
      </Button>
    </div>
  );
}
