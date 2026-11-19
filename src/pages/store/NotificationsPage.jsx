import { useState, useEffect } from 'react';
import { CheckCheck } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './NotificationsPage.module.css';

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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (err) {
      toastError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>الإشعارات</h1>
          <p className={styles.subtitle}>
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
            <CheckCheck size={16} />
            <span>تحديد الكل كمقروء ({unreadCount})</span>
          </Button>
        )}
      </header>

      {error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : loading ? (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <Skeleton width="45%" height="20px" />
              <div style={{ height: 8 }} />
              <Skeleton width="80%" height="16px" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات حالياً"
          description="ستصلك هنا كافة التنبيهات المتعلقة بحالة طلباتك أو مراجعة إشعار بنكك."
        />
      ) : (
        <div className={styles.list}>
          {notifications.map((item) => (
            <article
              key={item.id}
              onClick={() => !item.is_read && handleMarkRead(item.id)}
              className={`${styles.card} ${!item.is_read ? styles.unreadCard : ''}`}
              role={!item.is_read ? 'button' : undefined}
              tabIndex={!item.is_read ? 0 : undefined}
              onKeyDown={(e) => {
                if (!item.is_read && (e.key === 'Enter' || e.key === ' ')) {
                  handleMarkRead(item.id);
                }
              }}
            >
              <div className={styles.cardTop}>
                <h2 className={styles.cardTitle}>
                  {!item.is_read && <span className={styles.unreadDot} aria-hidden="true" />}
                  <span>{item.title}</span>
                </h2>
                <span className={styles.cardDate}>{formatDate(item.created_at)}</span>
              </div>

              <p className={styles.cardMessage}>{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
