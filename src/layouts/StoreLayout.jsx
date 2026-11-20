import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppBar from '../components/common/AppBar';
import BottomTabBar from '../components/common/BottomTabBar';
import SplashScreen from '../components/common/SplashScreen';
import PwaPrompt from '../components/common/PwaPrompt';
import { ordersApi } from '../api/orders';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { ar } from '../content/ar';
import styles from './StoreLayout.module.css';

export default function StoreLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('wex_splash_shown');
    } catch {
      return false;
    }
  });

  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const viewportRef = useRef(null);
  const scrollPositions = useRef({});
  const prevPathRef = useRef(location.pathname);
  const [navDirection, setNavDirection] = useState('forward');

  // Track navigation depth to determine RTL slide direction
  useEffect(() => {
    const current = location.pathname;
    const previous = prevPathRef.current;

    if (current !== previous) {
      // Determine if navigating deeper or back
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
    if (pathname === '/login') return { title: ar.auth.loginTitle, showBack: true, backTo: '/' };
    if (pathname === '/auth/verify') return { title: ar.auth.verifyTitle, showBack: true, backTo: '/login' };
    return { title: ar.common.appName, showBack: true, backTo: '/' };
  };

  const routeInfo = getRouteInfo(location.pathname);

  // Hide bottom tab bar on Product Detail, Cart, Checkout, and Order Detail
  // where a sticky bottom action bar takes its place
  const hideBottomNav =
    (location.pathname.startsWith('/products/') && location.pathname !== '/products') ||
    location.pathname === '/cart' ||
    location.pathname.startsWith('/checkout') ||
    (location.pathname.startsWith('/orders/') && location.pathname !== '/orders');

  // Load count of pending/active orders for bottom bar badge
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

  // Scroll Restoration / Keep-Alive Scroll Position
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Save previous scroll position
    const prevPath = location.pathname;

    const handleScroll = () => {
      scrollPositions.current[prevPath] = viewport.scrollTop;
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });

    // Restore scroll position for current route or scroll to top
    const savedPos = scrollPositions.current[location.pathname] || 0;
    viewport.scrollTop = savedPos;

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return (
    <div className={styles.desktopViewport}>
      {/* Session Splash Screen Overlay */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Main App Shell Frame (Max 480px) */}
      <div className={styles.appShell}>
        {/* Fixed App Bar */}
        <AppBar
          title={routeInfo.title}
          showLogo={routeInfo.isHome}
          showBack={routeInfo.showBack}
          backTo={routeInfo.backTo}
          unreadCount={unreadCount}
        />

        {/* Scrollable Content Viewport */}
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

        {/* Fixed Bottom Tab Bar (4 Tabs) */}
        {!hideBottomNav && (
          <BottomTabBar activeOrderCount={activeOrderCount} />
        )}

        {/* PWA Install & Offline Detection Prompt */}
        <PwaPrompt />
      </div>
    </div>
  );
}
