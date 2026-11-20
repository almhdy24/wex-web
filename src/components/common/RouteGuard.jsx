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
      <div className={styles.loadingContainer}>
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
      <div className={styles.loadingContainer}>
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
      <div className={styles.loadingContainer}>
        <Skeleton height="40px" width="200px" className={styles.topSkeleton} />
        <Skeleton height="150px" className={styles.mainSkeleton} />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'admin' || user?.role === 'staff') {
      const from = location.state?.from?.pathname || '/admin';
      return <Navigate to={from.startsWith('/admin') ? from : '/admin'} replace />;
    }
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
}
