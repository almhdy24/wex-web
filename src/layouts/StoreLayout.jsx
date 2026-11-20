import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppBar from '../components/common/AppBar';
import BottomTabBar from '../components/common/BottomTabBar';
import SplashScreen from '../components/common/SplashScreen';
import PwaPrompt from '../components/common/PwaPrompt';
import ScrollToTop from '../components/common/ScrollToTop';
import DesktopHeader from '../components/desktop/DesktopHeader';
import CartDrawer from '../components/desktop/CartDrawer';
import PendingOrderBanner from '../components/common/PendingOrderBanner';
import {
  AnnouncementBanner,
  AnnouncementToast,
  RecentPurchasesToast,
  OrdersDisabledBanner,
  StoreFooter,
} from '../components/store';
import { ordersApi } from '../api/orders';
import { productsApi } from '../api/products';
import { api } from '../api/client';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useViewport } from '../hooks/useViewport';
import { ar } from '../content/ar';
import styles from './StoreLayout.module.css';

export default function StoreLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isDesktop } = useViewport();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('wex_splash_shown');
    } catch {
      return false;
    }
  });

  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shopInfo, setShopInfo] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const viewportRef = useRef(null);
  const scrollPositions = useRef({});
  const prevPathRef = useRef(location.pathname);
  const [navDirection, setNavDirection] = useState('forward');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Network connection status listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      toastSuccess('عادت شبكة الإنترنت');
    };
    const handleOffline = () => {
      toastInfo('الاتصال بالإنترنت منقطع حالياً');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toastSuccess, toastInfo]);

  // Detect virtual on-screen keyboard via visualViewport (mobile/tablet only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleResize = () => {
      const isShrunk = window.visualViewport.height < window.innerHeight * 0.78;
      setIsKeyboardOpen(isShrunk);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }, []);

  // Track navigation depth to determine RTL slide direction
  useEffect(() => {
    const current = location.pathname;
    const previous = prevPathRef.current;

    if (current !== previous) {
      const depthOf = (p) => (p === '/' ? 0 : p.split('/').filter(Boolean).length);
      const isDeeper = depthOf(current) >= depthOf(previous);
      setNavDirection(isDeeper ? 'forward' : 'backward');
      prevPathRef.current = current;
    }
  }, [location.pathname]);

  // Route title mapping for AppBar
  const getRouteInfo = (pathname) => {
    if (pathname === '/') return { isHome: true, title: ar.common.appName };
    if (pathname === '/products') return { title: ar.catalog.title, showBack: true, backTo: '/' };
    if (pathname.startsWith('/products/')) return { title: ar.product.specifications, showBack: true, backTo: '/products' };
    if (pathname === '/cart') return { title: ar.cart.title, showBack: true, backTo: '/products' };
    if (pathname === '/checkout') return { title: ar.checkout.title, showBack: true, backTo: '/cart' };
    if (pathname === '/orders') return { title: ar.ordersList.title, showBack: false };
    if (pathname.startsWith('/orders/')) return { title: ar.orderDetail.priceLockedNotice, showBack: true, backTo: '/orders' };
    if (pathname === '/notifications') return { title: ar.notifications.title, showBack: true, backTo: '/' };
    if (pathname === '/account') return { title: ar.account.title, showBack: false };
    if (pathname === '/faq') return { title: ar.desktop.footer.faq, showBack: true, backTo: '/' };
    if (pathname === '/login') return { title: ar.auth.loginTitle, showBack: true, backTo: '/' };
    if (pathname === '/auth/verify') return { title: ar.auth.verifyTitle, showBack: true, backTo: '/login' };
    return { title: ar.common.appName, showBack: true, backTo: '/' };
  };

  const routeInfo = getRouteInfo(location.pathname);

  // Hide bottom tab bar on screens where sticky bottom action takes over
  const hideBottomNav =
    (location.pathname.startsWith('/products/') && location.pathname !== '/products') ||
    location.pathname === '/cart' ||
    location.pathname.startsWith('/checkout') ||
    (location.pathname.startsWith('/orders/') && location.pathname !== '/orders');

  // Load count of pending/active orders
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveOrderCount(0);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    ordersApi.getOrders({ status: 'pending_payment' })
      .then((res) => {
        if (isMounted) {
          const list = res?.data || [];
          setActiveOrderCount(list.length);
        }
      })
      .catch(() => {});

    notificationsApi.getUnreadCount()
      .then((res) => {
        if (isMounted) {
          setUnreadCount(res?.data?.unread_count || 0);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [isAuthenticated, location.pathname]);

  // Load shop public settings and active announcements
  useEffect(() => {
    let isMounted = true;
    productsApi.getShopInfo()
      .then((res) => {
        if (isMounted && res?.data) {
          setShopInfo(res.data);
        }
      })
      .catch(() => {});

    api.get('/announcements')
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          setAnnouncements(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll Restoration / Keep-Alive Scroll Position
  useEffect(() => {
    if (isDesktop) {
      window.scrollTo(0, 0);
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) return;

    const prevPath = location.pathname;
    const handleScroll = () => {
      scrollPositions.current[prevPath] = viewport.scrollTop;
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    const savedPos = scrollPositions.current[location.pathname] || 0;
    viewport.scrollTop = savedPos;

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, isDesktop]);

  // DESKTOP LAYOUT (>= 1024px)
  if (isDesktop) {
    return (
      <div className={styles.desktopShell}>
        <a href="#main-content" className={styles.skipLink}>انتقل إلى المحتوى الرئيسي</a>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        <DesktopHeader onOpenCart={() => setIsCartDrawerOpen(true)} />
        {shopInfo && shopInfo.orders_enabled === false && (
          <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'var(--space-4)', width: '100%' }}>
            <OrdersDisabledBanner message={shopInfo.orders_disabled_message} />
          </div>
        )}
        <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'var(--space-4)', width: '100%' }}>
          <AnnouncementBanner announcements={announcements} />
        </div>
        <PendingOrderBanner />

        <main id="main-content" className={styles.desktopMain} tabIndex={-1}>
          <Outlet />
        </main>

        <StoreFooter shopInfo={shopInfo} />

        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
        />

        <AnnouncementToast announcements={announcements} />
        <RecentPurchasesToast tickerEnabled={shopInfo?.ticker_enabled !== false} />

        <ScrollToTop />
        <PwaPrompt />
      </div>
    );
  }

  // PHONE & TABLET APP SHELL (< 1024px)
  const bottomOffset = isKeyboardOpen ? '16px' : (hideBottomNav ? '80px' : '68px');

  return (
    <div className={styles.desktopViewport}>
      <a href="#main-content" className={styles.skipLink}>انتقل إلى المحتوى الرئيسي</a>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className={styles.appShell} style={{ '--bottom-offset': bottomOffset }}>
        <AppBar
          title={routeInfo.title}
          showLogo={routeInfo.isHome}
          showBack={routeInfo.showBack}
          backTo={routeInfo.backTo}
          unreadCount={unreadCount}
        />
        {shopInfo && shopInfo.orders_enabled === false && (
          <div style={{ paddingInline: 'var(--space-4)' }}>
            <OrdersDisabledBanner message={shopInfo.orders_disabled_message} />
          </div>
        )}
        <div style={{ paddingInline: 'var(--space-4)' }}>
          <AnnouncementBanner announcements={announcements} />
        </div>
        <PendingOrderBanner />

        <main
          id="main-content"
          ref={viewportRef}
          className={styles.screensViewport}
          tabIndex={-1}
        >
          <div
            key={location.pathname}
            className={
              navDirection === 'forward'
                ? styles.screenContentForward
                : styles.screenContentBackward
            }
          >
            <Outlet />
          </div>
        </main>

        {!hideBottomNav && !isKeyboardOpen && (
          <BottomTabBar activeOrderCount={activeOrderCount} />
        )}

        <AnnouncementToast announcements={announcements} />
        <RecentPurchasesToast tickerEnabled={shopInfo?.ticker_enabled !== false} />

        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
        />

        <PwaPrompt />
      </div>
    </div>
  );
}
