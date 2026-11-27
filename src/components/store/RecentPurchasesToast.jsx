import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { api } from '../../api/client';
import { getProductImageUrl } from '../../utils/formatters';
import styles from './RecentPurchasesToast.module.css';
import { isDataSaver } from '../../utils/dataSaver';

const SESSION_COUNT_KEY = 'wex_recent_purchases_session_count';
const MAX_PER_SESSION = 3;
const ROTATION_INTERVAL_MS = 12000;

export function formatArabicRelativeTime(dateStr) {
  if (!dateStr) return 'لحظات';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'لحظات';
    if (diffMin === 1) return 'دقيقة';
    if (diffMin === 2) return 'دقيقتين';
    if (diffMin >= 3 && diffMin <= 10) return `${diffMin} دقائق`;
    if (diffMin < 60) return `${diffMin} دقيقة`;

    if (diffHours === 1) return 'ساعة';
    if (diffHours === 2) return 'ساعتين';
    if (diffHours >= 3 && diffHours <= 10) return `${diffHours} ساعات`;
    if (diffHours < 24) return `${diffHours} ساعة`;

    if (diffDays === 1) return 'يوم';
    if (diffDays === 2) return 'يومين';
    if (diffDays >= 3 && diffDays <= 10) return `${diffDays} أيام`;
    return `${diffDays} يومًا`;
  } catch {
    return 'لحظات';
  }
}

function getSessionCount() {
  try {
    const count = sessionStorage.getItem(SESSION_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementSessionCount() {
  try {
    const current = getSessionCount();
    sessionStorage.setItem(SESSION_COUNT_KEY, String(current + 1));
    return current + 1;
  } catch {
    return 1;
  }
}

export default function RecentPurchasesToast({
  purchases: propPurchases,
  tickerEnabled = true,
  isCartDrawerOpen = false,
}) {
  const location = useLocation();
  const [items, setItems] = useState(propPurchases || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [sessionCount, setSessionCount] = useState(getSessionCount);
  const timerRef = useRef(null);

  // Strictly block on checkout / payment screens, or when cart drawer is active
  const isExcludedScreen =
    Boolean(isCartDrawerOpen) ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/orders/') ||
    location.pathname === '/orders';

  useEffect(() => {
    if (propPurchases) {
      setItems(propPurchases.slice(0, 8));
      return;
    }

    // Decorative: not worth a request on Data Saver / 2G.
    if (!tickerEnabled || isDataSaver()) {
      return;
    }

    let isMounted = true;
    api.get('/recent-purchases')
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          setItems(res.data.slice(0, 8));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [propPurchases, tickerEnabled]);

  useEffect(() => {
    if (isExcludedScreen || items.length === 0 || !tickerEnabled) {
      setIsVisible(false);
      return;
    }

    // Read the persisted count (not the state value): this effect itself updates the
    // count, so depending on the state would re-trigger it and show a toast every 2s.
    if (getSessionCount() >= MAX_PER_SESSION) {
      setIsVisible(false);
      return;
    }

    // Show initial toast after a short delay
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
      const newCount = incrementSessionCount();
      setSessionCount(newCount);
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, [items.length, isExcludedScreen, tickerEnabled]);

  useEffect(() => {
    if (isExcludedScreen || items.length === 0 || !isVisible || !tickerEnabled) {
      return;
    }

    timerRef.current = setInterval(() => {
      const currentCount = getSessionCount();
      if (currentCount >= MAX_PER_SESSION) {
        setIsVisible(false);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      // Hide smoothly first
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
        const newCount = incrementSessionCount();
        setSessionCount(newCount);
      }, 400);
    }, ROTATION_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isVisible, isExcludedScreen, tickerEnabled]);

  if (isExcludedScreen || items.length === 0 || !tickerEnabled || sessionCount > MAX_PER_SESSION) {
    return null;
  }

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const timeAgo = formatArabicRelativeTime(currentItem.purchased_at);
  const imgUrl = getProductImageUrl(currentItem.thumbnail || currentItem.image_url);

  return (
    <div className={styles.toastWrap} role="region" aria-label="أحدث المشتريات">
      <aside
        className={`${styles.toast} ${isVisible ? styles.visible : styles.hidden}`}
        role="status"
        aria-live="polite"
      >
        <div className={styles.thumbBox} aria-hidden="true">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt=""
              className={styles.thumbImg}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/favicon.svg';
              }}
            />
          ) : (
            <ShoppingBag size={20} color="var(--color-primary, #5A54E6)" />
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.toastText}>
            <span>تم شراء </span>
            <strong className={styles.highlightProduct}>{currentItem.product_name}</strong>
            <span> قبل </span>
            <span className={styles.timeTag}>{timeAgo}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className={styles.dismissBtn}
          aria-label="إغلاق التنبيه"
          title="إغلاق"
        >
          <X size={15} />
        </button>
      </aside>
    </div>
  );
}
