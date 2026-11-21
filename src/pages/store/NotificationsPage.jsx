import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import Page from '../../components/common/Page';
import { t } from '../../content/ar';
import styles from './NotificationsPage.module.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications({ page: 1, per_page: 20 });
      setNotifications(res.data || []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    }

    if (notif.order_number) {
      navigate(`/orders/${notif.order_number}`);
    } else if (notif.data?.order_number) {
      navigate(`/orders/${notif.data.order_number}`);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (err) {
      toastError(err.message || 'تعذر تحديث الإشعارات');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Page className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('notifications.title')}</h1>
          <p className={styles.subtitle}>
            {t('notifications.subtitle')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            disabled={markingAll}
            onClick={handleMarkAllRead}
            className={styles.markAllBtn}
          >
            <CheckCheck size={14} />
            <span>{t('notifications.markAllRead')} ({unreadCount})</span>
          </button>
        )}
      </header>

      {error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : loading ? (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton width="45%" height="18px" />
              <Skeleton width="85%" height="14px" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title={t('notifications.noNotificationsTitle')}
          description={t('notifications.noNotificationsDesc')}
          actionLabel={t('common.backToHome')}
          onAction={() => navigate('/')}
        />
      ) : (
        <div className={styles.list}>
          {notifications.map((notif) => {
            const isUnread = !notif.is_read;
            const notifType = notif.type || 'order_update';

            let typeLabel = t('notifications.typeGeneral');
            if (notifType.includes('price_lock') || notifType.includes('order')) typeLabel = t('notifications.typeOrders');
            else if (notifType.includes('payment') || notifType.includes('proof')) typeLabel = t('notifications.typePayment');
            else if (notifType.includes('rate') || notifType.includes('price')) typeLabel = t('notifications.typePriceUpdate');

            return (
              <article
                key={notif.id}
                className={`${styles.card} ${isUnread ? styles.cardUnread : ''}`}
                onClick={() => handleNotificationClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNotificationClick(notif);
                }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.badgeWrapper}>
                    <span className={styles.typeBadge}>{typeLabel}</span>
                    {isUnread && <span className={styles.unreadDot} />}
                  </div>
                  <span className={styles.timeLabel}>
                    {formatDate(notif.created_at)}
                  </span>
                </div>

                <h3 className={styles.cardHeading}>
                  {notif.title || notif.subject || 'تحديث من ويكس تكنولوجي'}
                </h3>

                <p className={styles.cardBody}>
                  {notif.message || notif.body || notif.content}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
