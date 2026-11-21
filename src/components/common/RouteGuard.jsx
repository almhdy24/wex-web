import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from './Skeleton';
import Button from './Button';
import styles from './RouteGuard.module.css';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.loadingContainer} aria-busy="true" aria-label="جارٍ التحقق من الجلسة">
        <div className={styles.verifyingText}>جارٍ التحقق من الجلسة...</div>
        <Skeleton height="40px" width="200px" className={styles.topSkeleton} />
        <Skeleton height="150px" className={styles.mainSkeleton} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RoleGuard({ allowedRoles = ['admin'], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.loadingContainer} aria-busy="true" aria-label="جارٍ التحقق من الجلسة">
        <div className={styles.verifyingText}>جارٍ التحقق من الجلسة...</div>
        <Skeleton height="40px" width="200px" className={styles.topSkeleton} />
        <Skeleton height="150px" className={styles.mainSkeleton} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // If a customer tries to access admin panel
    if (user && user.role === 'customer') {
      return (
        <div className={styles.forbiddenContainer}>
          <div className={styles.forbiddenCard}>
            <h2 className={styles.forbiddenTitle}>هذه الصفحة مخصصة لإدارة المتجر</h2>
            <p className={styles.forbiddenText}>
              حسابك الحالي مسجل كعميل. يرجى العودة إلى واجهة المتجر للتسوق ومتابعة طلباتك.
            </p>
            <Link to="/">
              <Button variant="primary" size="md">
                العودة إلى المتجر
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    // If staff tries to access admin-only sub-route (like /admin/settings or /admin/users)
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.loadingContainer} aria-busy="true" aria-label="جارٍ التحقق من الجلسة">
        <div className={styles.verifyingText}>جارٍ التحقق من الجلسة...</div>
        <Skeleton height="40px" width="200px" className={styles.topSkeleton} />
        <Skeleton height="150px" className={styles.mainSkeleton} />
      </div>
    );
  }

  if (isAuthenticated) {
    const searchReturnTo = new URLSearchParams(location.search).get('returnTo');
    const rawFrom =
      typeof location.state?.from === 'string'
        ? location.state.from
        : location.state?.from?.pathname;
    const target = rawFrom || searchReturnTo || null;

    if (user?.role === 'admin' || user?.role === 'staff') {
      const adminTarget = target && target.startsWith('/admin') ? target : '/admin';
      return <Navigate to={adminTarget} replace />;
    }

    // Customer: Never redirect back to login or verify page; redirect to intended target or '/'
    const safeTarget =
      target && !target.startsWith('/login') && !target.startsWith('/auth')
        ? target
        : '/';
    return <Navigate to={safeTarget} replace />;
  }

  return children;
}
