import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatDate, getOrderStatusInfo } from '../../utils/formatters';
import AppBar from '../../components/common/AppBar';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import Price from '../../components/common/Price';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/common/Skeleton';
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

  const getChipStyle = (status, paymentState) => {
    if (status === 'completed' || status === 'confirmed' || paymentState === 'verified') return styles.statusSuccess;
    if (status === 'cancelled' || status === 'payment_rejected' || paymentState === 'rejected') return styles.statusDanger;
    if (status === 'pending_payment' || paymentState === 'under_review') return styles.statusPending;
    return styles.statusWaiting;
  };

  return (
    <div className={styles.pageWrapper}>
      <AppBar
        tone="navy"
        overlap={28}
        title="طلباتي"
        showBack={false}
      />

      <Page className={styles.container}>
        {error ? (
          <ErrorState message={error} onRetry={fetchOrders} />
        ) : loading ? (
          <div className={styles.ordersList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={118} className={styles.skeletonCard} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات سابقة."
            action={
              <Button variant="primary" onClick={() => navigate('/products')}>
                تصفّح الأجهزة
              </Button>
            }
          />
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
              const chipClass = getChipStyle(order.status, paymentState);

              return (
                <div key={order.id} className={styles.orderCard}>
                  {/* Accessible stretched link for whole card */}
                  <Link
                    to={`/orders/${order.order_number || order.id}`}
                    className={styles.cardOverlayLink}
                    aria-label={`طلب #${order.order_number}`}
                  />

                  {/* Header Row: رقم، الوقت، الحالة */}
                  <div className={styles.cardHeader}>
                    <div className={styles.orderTopLine}>
                      <span className={styles.orderNumber} dir="ltr">
                        #{order.order_number}
                      </span>
                      <span className={`${styles.statusChip} ${chipClass} ${styles[order.status] || ''}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <span className={styles.orderDate} dir="auto">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* Footer Row: الإجمالي، و زر ادفع الآن إن كان بانتظار الدفع */}
                  <div className={styles.cardFooter}>
                    <div className={styles.priceCol}>
                      <span className={styles.priceLabel}>الإجمالي:</span>
                      <Price value={orderTotal} size="sm" tone="navy" />
                    </div>

                    {isPending ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.order_number || order.id}`);
                        }}
                        className={`${styles.payNowBtn} ${styles.raisedAction}`}
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
                </div>
              );
            })}
          </div>
        )}
      </Page>
    </div>
  );
}
