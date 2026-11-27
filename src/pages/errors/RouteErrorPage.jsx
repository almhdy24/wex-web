import React from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

export default function RouteErrorPage({ homePath = '/' }) {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '12px',
      }}
      role="alert"
    >
      <h1 style={{ margin: 0, fontSize: '20px', color: '#111833' }}>
        حدث خطأ غير متوقع أثناء تحميل الصفحة
      </h1>
      <p style={{ margin: 0, fontSize: '14px', color: '#475569', maxWidth: '420px' }}>
        يرجى إعادة تحميل الصفحة أو العودة إلى الرئيسية.
      </p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: '44px',
            padding: '0 18px',
            borderRadius: '10px',
            border: 'none',
            background: '#114adb',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          إعادة المحاولة
        </button>
        <Link
          to={homePath}
          style={{
            minHeight: '44px',
            padding: '0 18px',
            borderRadius: '10px',
            border: '1px solid rgba(15, 23, 42, 0.16)',
            background: '#ffffff',
            color: '#111833',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          العودة
        </Link>
      </div>
    </div>
  );
}
