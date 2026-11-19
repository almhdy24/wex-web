import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function NotFoundPage() {
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
          fontSize: '5rem',
          fontWeight: 900,
          color: 'var(--color-navy)',
          lineHeight: 1,
          marginBottom: 'var(--space-2)',
        }}
      >
        404
      </div>
      <h1 style={{ marginBottom: 'var(--space-3)' }}>الصفحة المطلوبة غير موجودة</h1>
      <p style={{ maxWidth: 460, color: 'var(--color-slate-600)', marginBottom: 'var(--space-6)' }}>
        عذراً، يبدو أن الرابط الذي اتبعته غير صحيح أو تم نقل الصفحة. يمكنك العودة للصفحة الرئيسية أو تصفح كتالوج الأجهزة.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/">
          <Button variant="primary">العودة للرئيسية</Button>
        </Link>
        <Link to="/products">
          <Button variant="outline">تصفح الأجهزة</Button>
        </Link>
      </div>
    </div>
  );
}
