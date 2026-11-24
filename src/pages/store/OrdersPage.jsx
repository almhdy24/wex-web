import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { getOrderStatusInfo } from '../../utils/formatters';
import { deriveOrderUiState } from '../../utils/orderState';
import OrderNumber, { formatOrderNumber } from '../../components/common/OrderNumber';
import OrderDate from '../../components/common/OrderDate';
import AppBar from '../../components/common/AppBar';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import Price from '../../components/common/Price';
import Tabs from '../../components/common/Tabs';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/common/Skeleton';
import { swrCache } from '../../utils/swrCache';
import styles from './OrdersPage.module.css';

const ORDER_TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'بانتظار الدفع' },
  { id: 'active', label: 'قيد المعالجة' },
  { id: 'completed', label: 'المكتملة' },
];

export default function OrdersPage({
  initialOrders = null,
  initialLoading = null,
} = {}) {
  const cachedOrders = swrCache.get('my_orders');
  const [orders, setOrders] = useState(() => initialOrders ?? cachedOrders?.data ?? []);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(
    initialLoading ?? (initialOrders === null && !cachedOrders?.data)
  );
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async (signal) => {
    if (!cachedOrders?.data) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await ordersApi.getOrders({ per_page: 20 }, { signal });
      const fresh = res?.data || [];
      setOrders(fresh);
      swrCache.set('my_orders', fresh);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (!cachedOrders?.data) {
        setError(err.message || 'تعذر تحميل قائمة الطلبات');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrders !== null) return;
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [initialOrders]);

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (activeTab === 'pending') {
      return orders.filter((o) => {
        const ui = deriveOrderUiState(o);
        return ui.stage === 'pending_upload' || ui.stage === 'under_review' || o.status === 'pending_payment';
      });
    }
    if (activeTab === 'active') {
      return orders.filter((o) => {
        return ['confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status);
      });
    }
    if (activeTab === 'completed') {
      return orders.filter((o) => o.status === 'completed');
    }
    return orders;
  }, [orders, activeTab]);

  const getChipStyle = (status, uiStage) => {
    if (status === 'completed' || status === 'confirmed' || uiStage === 'verified') return styles.statusSuccess;
    if (status === 'cancelled' || status === 'payment_rejected' || uiStage === 'rejected' || uiStage === 'expired') return styles.statusDanger;
    if (status === 'pending_payment' || uiStage === 'under_review' || uiStage === 'pending_upload') return styles.statusPending;
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
              <Skeleton key={i} variant="card" height={118} borderRadius="var(--radius-card)" />
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
          <>
            {/* Filter Tabs */}
            <div className={styles.orderTabsWrapper}>
              <Tabs
                tabs={ORDER_TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
                ariaLabel="تصنيف الطلبات"
                variant="segment"
              />
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState
                title="لا توجد طلبات في هذا التصنيف."
              />
            ) : (
              <div className={styles.ordersList}>
                {filteredOrders.map((order) => {
                  const uiState = deriveOrderUiState(order);
                  const isPending = uiState.canUpload || (order.payment ? order.payment.can_upload : order.status === 'pending_payment');
                  const statusLabel = uiState.label || getOrderStatusInfo(order.status).label;
                  const orderTotal = order.total_sdg ?? order.total_amount_sdg ?? 0;
                  const chipClass = getChipStyle(order.status, uiState.stage);

                  return (
                    <div key={order.id} className={styles.orderCard}>
                      {/* Accessible stretched link for whole card */}
                      <Link
                        to={`/orders/${order.order_number || order.id}`}
                        className={styles.cardOverlayLink}
                        aria-label={`طلب ${formatOrderNumber(order.order_number)}`}
                      />

                      {/* Header Row: رقم، الوقت، الحالة */}
                      <div className={styles.cardHeader}>
                        <div className={styles.orderTopLine}>
                          <OrderNumber
                            value={order.order_number}
                            withHash
                            className={styles.orderNumber}
                          />
                          <span className={`${styles.statusChip} ${chipClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <OrderDate
                          date={order.created_at}
                          showRelative
                          label=""
                          className={styles.orderDate}
                        />
                      </div>

                      {/* Items Snippet (if items array exists) */}
                      {order.items && order.items.length > 0 && (
                        <div className={styles.orderSnippet}>
                          <span className={styles.firstItemName} dir="auto">
                            {order.items[0].product_name || order.items[0].name || order.items[0].title}
                          </span>
                          {order.items.length > 1 && (
                            <span className={styles.moreItemsBadge}>
                              +{order.items.length - 1} أجهزة أخرى
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Row: الإجمالي، و زر رفع الإشعار إن كان بانتظار التحويل */}
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
                            {uiState.primaryAction || 'رفع إشعار التحويل'}
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
          </>
        )}
      </Page>
    </div>
  );
}
