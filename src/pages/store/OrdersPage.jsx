import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Truck, Store, Clock, ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
          <h1 className={styles.title}>طلباتي</h1>
          <p className={styles.subtitle}>
            متابعة حالة الطلبات، إشعارات الدفع، وتأكيدات الاستلام
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className={styles.filterTabs} role="tablist" aria-label="تصفية الطلبات">
          {[
            { key: '', label: 'الكل' },
            { key: 'pending_payment', label: 'بانتظار الدفع' },
            { key: 'confirmed', label: 'المؤكدة' },
            { key: 'completed', label: 'المكتملة' },
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
            <div key={i} className={styles.orderCard}>
              <Skeleton width="40%" height="22px" />
              <div style={{ height: 8 }} />
              <Skeleton width="60%" height="16px" />
              <div style={{ height: 12 }} />
              <Skeleton width="25%" height="24px" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات مسجلة"
          description={
            statusFilter
              ? 'لا توجد طلبات تطابق هذه الحالة المحددة.'
              : 'لم تقم بإنشاء أي طلبات حتى الآن. استكشف المعروضات وابدأ طلبك.'
          }
          actionLabel="تصفح الأجهزة"
          onAction={() => navigate('/products')}
        />
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.status);
            return (
              <article key={order.order_number} className={styles.orderCard}>
                <div className={styles.cardTop}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                      رقم الطلب
                    </span>
                    <div className={styles.orderNumber}>#{order.order_number}</div>
                  </div>
                  <Tag variant={statusInfo.variant}>{statusInfo.label}</Tag>
                </div>

                <div className={styles.orderMetaGrid}>
                  <div className={styles.metaItem}>
                    <Calendar size={14} className={styles.metaIcon} />
                    <span>{formatDate(order.created_at)}</span>
                  </div>

                  <div className={styles.metaItem}>
                    {order.delivery_type === 'pickup' ? (
                      <>
                        <Store size={14} className={styles.metaIcon} />
                        <span>استلام من المحل</span>
                      </>
                    ) : (
                      <>
                        <Truck size={14} className={styles.metaIcon} />
                        <span>توصيل</span>
                      </>
                    )}
                  </div>

                  {order.status === 'pending_payment' && order.seconds_remaining > 0 && (
                    <div className={`${styles.metaItem} ${styles.remainingAlert}`}>
                      <Clock size={14} />
                      <span>
                        متبقي للحجز: {Math.ceil(order.seconds_remaining / 60)} دقيقة
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.cardBottom}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                      المبلغ المثبت:{' '}
                    </span>
                    <span className={styles.totalPrice}>
                      {formatSdg(order.total_sdg)}
                    </span>
                  </div>

                  <Link to={`/orders/${order.order_number}`}>
                    <Button variant="outline" size="sm">
                      <span>تفاصيل ومتابعة الطلب</span>
                      <ArrowLeft size={14} />
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <nav className={styles.pagination} aria-label="تنقل الصفحات">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
              <span className={styles.pageCount}>
                صفحة {meta.page} من {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
