import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import styles from './OrdersPage.module.css';

export default function OrdersPage({
  initialOrders = null,
  initialLoading = null,
} = {}) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(initialLoading ?? (initialOrders === null));
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrders({ per_page: 20 });
      setOrders(res?.data || []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل قائمة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrders === null) {
      fetchOrders();
    }
  }, [initialOrders]);

  return (
    <Page className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>طلباتي</h1>
      </header>

      {error ? (
        <div className={styles.errorCard}>
          <p>{error}</p>
          <Button variant="secondary" onClick={fetchOrders}>
            إعادة المحاولة
          </Button>
        </div>
      ) : loading ? (
        <div className={styles.ordersList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyText}>لا توجد طلبات سابقة.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            تصفّح الأجهزة
          </Button>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const paymentState = order.payment?.state;
            const isPending = order.payment ? order.payment.can_upload : order.status === 'pending_payment';
            const statusInfo = paymentState === 'under_review'
              ? { label: 'قيد المراجعة', variant: 'info' }
              : paymentState === 'rejected'
              ? { label: 'تم رفض الإشعار', variant: 'danger' }
              : getOrderStatusInfo(order.status);
            const orderTotal = order.total_sdg ?? order.total_amount_sdg ?? 0;

            return (
              <article
                key={order.id}
                className={styles.orderCard}
                onClick={() => navigate(`/orders/${order.order_number || order.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/orders/${order.order_number || order.id}`);
                }}
              >
                {/* Header Row: رقم، الوقت، الحالة */}
                <div className={styles.cardHeader}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderNumber}>
                      #{order.order_number}
                    </span>
                    <span className={styles.orderDate}>
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <span className={`${styles.statusChip} ${styles[order.status] || ''}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Footer Row: الإجمالي، و زر ادفع الآن إن كان بانتظار الدفع */}
                <div className={styles.cardFooter}>
                  <div className={styles.priceCol}>
                    <span className={styles.priceLabel}>الإجمالي:</span>
                    <span className={styles.priceVal}>{formatSdg(orderTotal)}</span>
                  </div>

                  {isPending ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.order_number || order.id}`);
                      }}
                      className={styles.payNowBtn}
                    >
                      ادفع الآن
                    </Button>
                  ) : (
                    <div className={styles.viewLink}>
                      <span>تفاصيل</span>
                      <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
