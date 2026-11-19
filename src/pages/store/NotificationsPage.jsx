import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notifications';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { success, error: toastError } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications({ page: 1, per_page: 20 });
      setNotifications(res.data || []);
    } catch (err) {
      setError(err.message || 'فشل تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (err) {
      toastError(err.message || 'فشل تحديث الإشعارات');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>الإشعارات والتنبيهات</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            متابعة إشعارات تأكيد الطلبات، مراجعة التحويلات، وتحديثات التسليم
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={markingAll}
            onClick={handleMarkAllRead}
          >
            تحديد الكل كمقروء ({unreadCount})
          </Button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 'var(--space-4)' }}>
              <Skeleton width="45%" height="20px" style={{ marginBottom: 'var(--space-2)' }} />
              <Skeleton width="80%" height="16px" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات حالياً"
          description="ستصلك هنا كافة التنبيهات المتعلقة بحالة طلباتك، انتهاء مدة حجز الأسعار، أو وصول إشعار بنكك."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.is_read && handleMarkRead(item.id)}
              className="card card-hover"
              style={{
                padding: 'var(--space-4) var(--space-5)',
                backgroundColor: item.is_read ? 'var(--color-white)' : 'var(--color-ice-blue-alt)',
                borderLeft: !item.is_read ? '4px solid var(--color-royal-blue)' : '1px solid var(--color-slate-200)',
                cursor: !item.is_read ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>
                  {item.title}
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>
                  {formatDate(item.created_at)}
                </span>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', margin: 0, lineHeight: 1.6 }}>
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
