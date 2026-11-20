import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders';
import { calculateTimeLeft, formatCountdown } from '../../utils/formatters';
import styles from './PendingOrderBanner.module.css';

export default function PendingOrderBanner() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [activeOrder, setActiveOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Fetch active pending order
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveOrder(null);
      return;
    }

    let isMounted = true;

    const fetchPending = async () => {
      try {
        const res = await ordersApi.getOrders({ status: 'pending_payment', per_page: 1 });
        const orders = res?.data || [];
        if (isMounted && orders.length > 0) {
          const order = orders[0];
          // Check if session dismissed
          const isDismissed = sessionStorage.getItem(`wex_pending_dismiss_${order.order_number}`);
          if (isDismissed) {
            setDismissed(true);
          } else {
            setActiveOrder(order);
            setTimeLeft(calculateTimeLeft(order.expires_at || order.lock_expires_at));
          }
        } else if (isMounted) {
          setActiveOrder(null);
        }
      } catch {
        // quiet failure
      }
    };

    fetchPending();

    // Check periodically every 60 seconds
    const pollInterval = setInterval(fetchPending, 60000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // Live 1-second countdown
  useEffect(() => {
    const expiry = activeOrder?.expires_at || activeOrder?.lock_expires_at;
    if (!expiry) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(expiry);
      setTimeLeft(remaining);
      if (remaining.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeOrder]);

  // Don't render banner if already on this order's page
  if (
    !activeOrder ||
    dismissed ||
    !timeLeft ||
    timeLeft.expired ||
    location.pathname === `/orders/${activeOrder.order_number}`
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`wex_pending_dismiss_${activeOrder.order_number}`, '1');
    } catch {
      // ignore
    }
  };

  const formattedTimer = formatCountdown(timeLeft.hours, timeLeft.minutes, timeLeft.seconds);
  const isUrgent = timeLeft.totalMs < 45 * 60 * 1000; // < 45 mins

  return (
    <div
      role="region"
      aria-label="تنبيه طلب بانتظار السداد"
      className={`${styles.banner} ${isUrgent ? styles.urgent : ''}`}
    >
      <div className={styles.innerContainer}>
        <div className={styles.contentWrap}>
          <div className={styles.iconBox}>
            {isUrgent ? (
              <ShieldAlert size={18} className={styles.urgentIcon} />
            ) : (
              <Clock size={18} className={styles.clockIcon} />
            )}
          </div>

          <div className={styles.textWrap}>
            <span className={styles.title}>
              لديك طلب محجوز بانتظار سداد بنكك (طلب #{activeOrder.order_number})
            </span>
            <span className={styles.subtitle}>
              السعر مثبت ومحجوز. متبقي:{' '}
              <strong className={styles.timerDisplay}>{formattedTimer}</strong>
            </span>
          </div>
        </div>

        <div className={styles.actionsWrap}>
          <Link to={`/orders/${activeOrder.order_number}`} className={styles.actionBtn}>
            <span>إتمام السداد ورفع الإشعار</span>
            <ArrowLeft size={15} />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className={styles.dismissBtn}
            aria-label="إخفاء التنبيه مؤقتًا"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
