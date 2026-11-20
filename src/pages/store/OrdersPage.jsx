import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import { t } from '../../content/ar';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await ordersApi.getOrders(params);
      setOrders(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message || 'تعذر تحميل سجل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('ordersList.title')}</h1>
          <p className={styles.subtitle}>
            {t('ordersList.subtitle')}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className={styles.filterTabs} role="tablist" aria-label="تصفية الطلبات">
          {[
            { key: '', label: t('ordersList.tabAll') },
            { key: 'pending_payment', label: t('ordersList.tabPending') },
            { key: 'confirmed', label: t('ordersList.tabConfirmed') },
            { key: 'completed', label: t('ordersList.tabCompleted') },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.filterTab} ${
                statusFilter === tab.key ? styles.filterTabActive : ''
              }`}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              role="tab"
              aria-selected={statusFilter === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : loading ? (
        <div className={styles.ordersList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton width="40%" height="20px" />
              <Skeleton width="70%" height="16px" />
              <Skeleton width="30%" height="22px" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title={t('ordersList.noOrdersTitle')}
          description={
            statusFilter
              ? 'لا توجد طلبات تطابق هذه الحالة المحددة.'
              : t('ordersList.noOrdersDesc')
          }
          actionLabel={t('cart.startShopping')}
          onAction={() => navigate('/products')}
        />
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.status);
            const isPending = order.status === 'pending_payment';

            return (
              <article
                key={order.id}
                className={styles.orderCard}
                onClick={() => navigate(`/orders/${order.order_number}`)}
                role="button"
                tabIndex={0}
                aria-label={`عرض تفاصيل الطلب ${order.order_number}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/orders/${order.order_number}`);
                }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.orderNumber}>
                      #{order.order_number}
                    </span>
                    <div className={styles.orderDate}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  <span className={`${styles.statusChip} ${styles[order.status] || ''}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.productSummary}>
                    {order.items?.length > 0
                      ? order.items.map((it) => it.product_name).join('، ')
                      : 'أجهزة وإلكترونيات'}
                  </div>

                  <div className={styles.priceRow}>
                    <div className={styles.priceCol}>
                      <span className={styles.priceLabel}>الإجمالي:</span>
                      <span className={styles.priceVal}>
                        {formatSdg(order.total_amount_sdg)}
                      </span>
                    </div>

                    {isPending && (
                      <span className={styles.countdownPill}>
                        <Clock size={12} />
                        <span>السعر محجوز</span>
                      </span>
                    )}

                    <span className={styles.detailsLink}>
                      <span>تفاصيل الطلب</span>
                      <ArrowLeft size={14} />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={styles.pageBtn}
          >
            السابق
          </button>
          <span className={styles.pageInfo}>
            صفحة {page} من {meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            className={styles.pageBtn}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
