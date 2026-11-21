import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../api/orders';
import { deriveOrderUiState, formatCountdownTime } from '../../utils/orderState';
import { getServerTimeOffset } from '../../api/client';
import styles from './PendingOrderBanner.module.css';

export default function PendingOrderBanner() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [activeOrder, setActiveOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Allowed routes: ONLY Home, Catalog, Cart, Product, Orders
  const pathname = location.pathname;
  const isAllowedRoute =
    pathname === '/' ||
    pathname === '/catalog' ||
    pathname === '/products' ||
    pathname === '/cart' ||
    pathname === '/orders' ||
    (pathname.startsWith('/products/') && pathname !== '/products');

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveOrder(null);
      return;
    }

    let isMounted = true;
    const fetchPending = async () => {
      try {
        const res = await ordersApi.getOrders({ per_page: 5 });
        const orders = res?.data || [];
        if (!isMounted) return;

        // Find the most recent order that needs payment upload
        const found = orders.find((o) => {
          const state = deriveOrderUiState(o, Date.now(), getServerTimeOffset());
          return state.showBanner;
        });

        if (found) {
          const isDismissed = sessionStorage.getItem(`wex_pending_dismiss_${found.order_number}`);
          if (isDismissed) {
            setDismissed(true);
          } else {
            setActiveOrder(found);
            setDismissed(false);
          }
        } else {
          setActiveOrder(null);
        }
      } catch {
        // quiet failure
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, pathname]);

  // 1-second live tick
  useEffect(() => {
    if (!activeOrder?.lock_expires_at) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeOrder?.lock_expires_at]);

  if (!isAllowedRoute || !activeOrder || dismissed) {
    return null;
  }

  const offset = getServerTimeOffset();
  const uiState = deriveOrderUiState(activeOrder, now, offset);

  if (!uiState.showBanner || uiState.countdown <= 0) {
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

  const formattedTimer = formatCountdownTime(uiState.countdown);
  const isUrgent = uiState.countdown < 45 * 60;

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
              <ShieldAlert size={16} className={styles.urgentIcon} />
            ) : (
              <Clock size={16} className={styles.clockIcon} />
            )}
          </div>
          <div className={styles.textWrap}>
            <span className={styles.title}>
              طلب #{activeOrder.order_number} ({formattedTimer})
            </span>
          </div>
        </div>

        <div className={styles.actionsWrap}>
          <Link to={`/orders/${activeOrder.order_number}`} className={styles.actionBtn}>
            <span>{uiState.primaryAction || 'ادفع الآن'}</span>
            <ArrowLeft size={14} />
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className={styles.dismissBtn}
            aria-label="إخفاء التنبيه مؤقتًا"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
