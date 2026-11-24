import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Laptop,
  FolderTree,
  Sliders,
  LayoutGrid,
  Megaphone,
  Activity,
  HelpCircle,
  FileText,
  ScrollText,
  Landmark,
  TrendingUp,
  Truck,
  Settings,
  Users,
  Menu,
  Search,
  ExternalLink,
  LogOut,
  Volume2,
  VolumeX,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import Sheet from '../common/Sheet';
import ConfirmDialog from './ConfirmDialog';
import OrderNumber from '../common/OrderNumber';
import styles from './AdminShell.module.css';

// S1: Top-level routes where back arrow should NOT be shown
const TOP_LEVEL_ADMIN_ROUTES = new Set([
  '/admin',
  '/admin/orders',
  '/admin/payments',
  '/admin/products',
  '/admin/categories',
  '/admin/hero-slides',
  '/admin/home-sections',
  '/admin/announcements',
  '/admin/recent-purchases',
  '/admin/faq',
  '/admin/pages',
  '/admin/payment-accounts',
  '/admin/rates',
  '/admin/shipping-zones',
  '/admin/settings',
  '/admin/users',
  '/admin/audit-logs',
]);

// S4: Route meta title map
const ROUTE_TITLES = {
  '/admin': adminAr.brand.adminTitle,
  '/admin/orders': adminAr.nav.orders,
  '/admin/payments': adminAr.nav.payments,
  '/admin/products': adminAr.nav.products,
  '/admin/products/new': 'إضافة جهاز جديد',
  '/admin/categories': adminAr.nav.categories,
  '/admin/hero-slides': adminAr.nav.heroSlides,
  '/admin/home-sections': adminAr.nav.homeSections,
  '/admin/announcements': adminAr.nav.announcements,
  '/admin/recent-purchases': adminAr.nav.recentPurchases,
  '/admin/faq': adminAr.nav.faq,
  '/admin/pages': adminAr.nav.pages,
  '/admin/payment-accounts': adminAr.nav.paymentAccounts,
  '/admin/rates': adminAr.nav.rates,
  '/admin/shipping-zones': adminAr.nav.shippingZones,
  '/admin/settings': adminAr.nav.settings,
  '/admin/users': adminAr.nav.users,
  '/admin/audit-logs': adminAr.nav.auditLogs,
};

function getPageTitle(pathname) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/admin/orders/')) return 'تفاصيل الطلب';
  if (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit')) return 'تعديل الجهاز';
  return adminAr.brand.adminTitle;
}

export default function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [activeRate, setActiveRate] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // S5: Mobile search overlay state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);

  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // S10: Single reusable AudioContext created lazily on user gesture
  const audioContextRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const initOrGetAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        initOrGetAudioContext();
      }
      return next;
    });
  };

  const playChime = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      const ctx = initOrGetAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context may be restricted by browser policy
    }
  }, [initOrGetAudioContext]);

  // S7 & S8: Idle Timer with live countdown and proper logout flow
  const [idleCountdown, setIdleCountdown] = useState(120);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleIdleTimeout = useCallback(async () => {
    await logout();
    navigate('/login?reason=idle');
  }, [logout, navigate]);

  const { isWarning, resetTimer } = useIdleTimer({
    onTimeout: handleIdleTimeout,
  });

  useEffect(() => {
    let timer;
    if (isWarning) {
      setIdleCountdown(120);
      timer = setInterval(() => {
        setIdleCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWarning]);

  // S9: Robust background polling without deps thrashing and no chime on first load
  const prevCountRef = useRef(-1);

  useEffect(() => {
    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await adminApi.getDashboard();
        if (res.data) {
          const count = res.data.pending_reviews_count || 0;
          if (prevCountRef.current !== -1 && count > prevCountRef.current && soundEnabledRef.current) {
            playChime();
          }
          prevCountRef.current = count;
          setPendingPaymentsCount(count);

          if (res.data.exchange_rate?.rate_sdg) {
            setActiveRate(res.data.exchange_rate.rate_sdg);
          }

          if (typeof document !== 'undefined') {
            document.title =
              count > 0
                ? `(${count}) ${adminAr.brand.name} - الإدارة`
                : `${adminAr.brand.name} - الإدارة`;
          }
        }
      } catch {
        // Silent failure during polling
      }
    };

    poll();
    const interval = setInterval(poll, 30000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        poll();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [playChime]);

  // S6: Global Search Execution with keyboard navigation & outside click close
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      setActiveSearchIndex(-1);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchOpen(true);
      setActiveSearchIndex(-1);
      try {
        const q = searchQuery.trim();
        const [ordersRes, prodsRes] = await Promise.allSettled([
          adminApi.getOrders({ q, per_page: 5 }),
          isAdmin ? adminApi.getProducts({ q, per_page: 5 }) : Promise.resolve({ data: [] }),
        ]);

        const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data || [] : [];
        const products = prodsRes.status === 'fulfilled' ? prodsRes.value.data || [] : [];

        setSearchResults({ orders, products });
      } catch {
        setSearchResults({ orders: [], products: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, isAdmin]);

  // S6: Close search on outside click & route change
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // S5: Focus search input on mobile search open
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // S6: Keyboard navigation for search dropdown
  const allSearchItems = [
    ...(searchResults?.orders?.map((ord) => ({
      type: 'order',
      id: ord.order_number,
      url: `/admin/orders/${ord.order_number}`,
      primary: `#${ord.order_number}`,
      secondary: `${ord.customer_name} (${ord.customer_phone})`,
      phone: ord.customer_phone,
    })) || []),
    ...(searchResults?.products?.map((prod) => ({
      type: 'product',
      id: prod.id,
      url: `/admin/products/${prod.id}/edit`,
      primary: prod.name,
      secondary: `${prod.price_aed} (${adminAr.brand.forAdminOnly})`,
    })) || []),
  ];

  const handleSearchKeyDown = (e) => {
    if (!searchOpen || allSearchItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex((prev) => (prev + 1 < allSearchItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex((prev) => (prev > 0 ? prev - 1 : allSearchItems.length - 1));
    } else if (e.key === 'Enter' && activeSearchIndex >= 0) {
      e.preventDefault();
      const item = allSearchItems[activeSearchIndex];
      if (item) {
        navigate(item.url);
        setSearchOpen(false);
        setMobileSearchOpen(false);
        setSearchQuery('');
      }
    }
  };

  // Keyboard shortcut for search (/ or Ctrl+K)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e) => {
      if (
        (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        document.getElementById('admin-global-search')?.focus();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // S1 & S2 & S3: Smart Back Navigation
  const isDetailOrSubRoute = !TOP_LEVEL_ADMIN_ROUTES.has(location.pathname);

  const handleSmartBack = () => {
    if (typeof window !== 'undefined' && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      pathSegments.pop();
      const parentPath = '/' + pathSegments.join('/');
      navigate(parentPath || '/admin');
    }
  };

  const currentPageTitle = getPageTitle(location.pathname);

  return (
    <div className={styles.layout}>
      {/* ====================================================================
          Desktop & Tablet Sidebar
          ==================================================================== */}
      <aside className={styles.sidebar}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>
              Wex <span className={styles.brandAccent}>لوحة الإدارة</span>
            </span>
            <span className={styles.brandSubtitle}>لوحة العمليات</span>
          </div>
        </div>

        {/* User Role Card */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {isAdmin ? <ShieldCheck size={18} /> : <UserCheck size={18} />}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.name || 'طاقم العمل'}</span>
            <span className={styles.userRoleBadge}>
              {isAdmin ? adminAr.brand.roleAdmin : adminAr.brand.roleStaff}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={styles.navMenu} aria-label="أقسام لوحة الإدارة">
          {/* Group 1: العمليات */}
          <div className={styles.navGroupHeader}>{adminAr.nav.groupOperations}</div>
          <NavLink
            to="/admin"
            end
            title={adminAr.nav.dashboard}
            aria-label={adminAr.nav.dashboard}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}
          >
            <LayoutDashboard size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.dashboard}</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            title={adminAr.nav.orders}
            aria-label={adminAr.nav.orders}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}
          >
            <Package size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.orders}</span>
          </NavLink>

          <NavLink
            to="/admin/payments"
            title={adminAr.nav.payments}
            aria-label={adminAr.nav.payments}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}
          >
            <CreditCard size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.payments}</span>
            {pendingPaymentsCount > 0 && (
              <span
                className={styles.navBadge}
                aria-label={`${pendingPaymentsCount} إشعار قيد المراجعة`}
              >
                {pendingPaymentsCount}
              </span>
            )}
          </NavLink>

          {/* Group 2: المتجر */}
          {isAdmin && (
            <>
              <div className={styles.navGroupHeader}>{adminAr.nav.groupStore}</div>
              <NavLink
                to="/admin/products"
                title={adminAr.nav.products}
                aria-label={adminAr.nav.products}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <Laptop size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.products}</span>
              </NavLink>

              <NavLink
                to="/admin/categories"
                title={adminAr.nav.categories}
                aria-label={adminAr.nav.categories}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <FolderTree size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.categories}</span>
              </NavLink>
            </>
          )}

          {/* Group 3: المحتوى والواجهة */}
          <div className={styles.navGroupHeader}>{adminAr.nav.groupContent}</div>
          {isAdmin && (
            <>
              <NavLink
                to="/admin/hero-slides"
                title={adminAr.nav.heroSlides}
                aria-label={adminAr.nav.heroSlides}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <Sliders size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.heroSlides}</span>
              </NavLink>

              <NavLink
                to="/admin/home-sections"
                title={adminAr.nav.homeSections}
                aria-label={adminAr.nav.homeSections}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <LayoutGrid size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.homeSections}</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/admin/announcements"
            title={adminAr.nav.announcements}
            aria-label={adminAr.nav.announcements}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}
          >
            <Megaphone size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.announcements}</span>
          </NavLink>

          <NavLink
            to="/admin/recent-purchases"
            title={adminAr.nav.recentPurchases}
            aria-label={adminAr.nav.recentPurchases}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}
          >
            <Activity size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.recentPurchases}</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink
                to="/admin/faq"
                title={adminAr.nav.faq}
                aria-label={adminAr.nav.faq}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <HelpCircle size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.faq}</span>
              </NavLink>

              <NavLink
                to="/admin/pages"
                title={adminAr.nav.pages}
                aria-label={adminAr.nav.pages}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <FileText size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.pages}</span>
              </NavLink>
            </>
          )}

          {/* Group 4: الدفع والتسعير (Admin only) */}
          {isAdmin && (
            <>
              <div className={styles.navGroupHeader}>{adminAr.nav.groupPricing}</div>
              <NavLink
                to="/admin/payment-accounts"
                title={adminAr.nav.paymentAccounts}
                aria-label={adminAr.nav.paymentAccounts}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <Landmark size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.paymentAccounts}</span>
              </NavLink>

              <NavLink
                to="/admin/rates"
                title={adminAr.nav.rates}
                aria-label={adminAr.nav.rates}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <TrendingUp size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.rates}</span>
              </NavLink>

              <NavLink
                to="/admin/shipping-zones"
                title={adminAr.nav.shippingZones}
                aria-label={adminAr.nav.shippingZones}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <Truck size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.shippingZones}</span>
              </NavLink>
            </>
          )}

          {/* Group 5: النظام (Admin only) */}
          {isAdmin && (
            <>
              <div className={styles.navGroupHeader}>{adminAr.nav.groupSystem}</div>
              <NavLink
                to="/admin/settings"
                title={adminAr.nav.settings}
                aria-label={adminAr.nav.settings}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <Settings size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.settings}</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                title={adminAr.nav.users}
                aria-label={adminAr.nav.users}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <Users size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.users}</span>
              </NavLink>

              {/* S11: ScrollText icon for audit logs */}
              <NavLink
                to="/admin/audit-logs"
                title={adminAr.nav.auditLogs}
                aria-label={adminAr.nav.auditLogs}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNav : ''}`
                }
              >
                <ScrollText size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.auditLogs}</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <Link
            to="/"
            className={styles.storeLink}
            target="_blank"
            rel="noopener noreferrer"
            title={adminAr.brand.storeFrontLink}
            aria-label={adminAr.brand.storeFrontLink}
          >
            <ExternalLink size={16} />
            <span className={styles.storeLinkLabel}>{adminAr.brand.storeFrontLink}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutBtn}
            title={adminAr.brand.logout}
            aria-label={adminAr.brand.logout}
          >
            <LogOut size={16} />
            <span className={styles.logoutBtnLabel}>{adminAr.brand.logout}</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          Main Content Container
          ==================================================================== */}
      <div className={styles.mainContainer}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          {/* Mobile Header Elements */}
          <div className={styles.mobileTopRow}>
            {/* S1 & S2 & S3: Back button only on subroutes, with ChevronRight */}
            {isDetailOrSubRoute && (
              <button
                type="button"
                onClick={handleSmartBack}
                className={styles.mobileBackBtn}
                aria-label="رجوع إلى الصفحة السابقة"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* S4: Dynamic page title */}
            <span className={styles.mobileBarTitle}>{currentPageTitle}</span>

            {/* S15: Compact exchange rate chip on mobile for dashboard */}
            {activeRate && location.pathname === '/admin' && (
              <span className={styles.mobileRateChip}>{activeRate} ج.س</span>
            )}
          </div>

          {/* Desktop Global Search Bar */}
          <div ref={searchContainerRef} className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                id="admin-global-search"
                type="search"
                className={styles.searchInput}
                placeholder={adminAr.common.globalSearchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                aria-autocomplete="list"
                aria-controls="admin-search-listbox"
                aria-expanded={searchOpen}
              />
              <kbd className={styles.searchKbd}>/</kbd>
            </div>

            {/* S6: Global Search Results Dropdown with role="listbox" & role="option" */}
            {searchOpen && searchResults && (
              <div
                id="admin-search-listbox"
                className={styles.searchDropdown}
                role="listbox"
                aria-label="نتائج البحث السريع"
              >
                {searchLoading ? (
                  <div className={styles.searchMsg}>{adminAr.common.loading}</div>
                ) : searchResults.orders.length === 0 && searchResults.products.length === 0 ? (
                  <div className={styles.searchMsg}>{adminAr.common.globalSearchNoResults}</div>
                ) : (
                  <>
                    {searchResults.orders.length > 0 && (
                      <div className={styles.searchGroup}>
                        <div className={styles.searchGroupTitle}>{adminAr.nav.orders}</div>
                        {searchResults.orders.map((ord, idx) => {
                          const isFocused = activeSearchIndex === idx;
                          return (
                            <Link
                              key={ord.order_number}
                              to={`/admin/orders/${ord.order_number}`}
                              className={`${styles.searchItem} ${isFocused ? styles.activeSearchItem : ''}`}
                              role="option"
                              aria-selected={isFocused}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              <span className={styles.searchItemPrimary}>
                                <OrderNumber value={ord.order_number} withHash />
                              </span>
                              <span className={styles.searchItemSecondary}>
                                {ord.customer_name}{' '}
                                {ord.customer_phone && (
                                  <bdi dir="ltr">({ord.customer_phone})</bdi>
                                )}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {searchResults.products.length > 0 && (
                      <div className={styles.searchGroup}>
                        <div className={styles.searchGroupTitle}>{adminAr.nav.products}</div>
                        {searchResults.products.map((prod, idx) => {
                          const itemIdx = searchResults.orders.length + idx;
                          const isFocused = activeSearchIndex === itemIdx;
                          return (
                            <Link
                              key={prod.id}
                              to={`/admin/products/${prod.id}/edit`}
                              className={`${styles.searchItem} ${isFocused ? styles.activeSearchItem : ''}`}
                              role="option"
                              aria-selected={isFocused}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              <span className={styles.searchItemPrimary}>{prod.name}</span>
                              <span className={styles.searchItemSecondary}>
                                {prod.price_aed} ({adminAr.brand.forAdminOnly})
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Top Bar End Actions */}
          <div className={styles.topBarActions}>
            {/* S5: Mobile Search Icon Button */}
            <button
              type="button"
              className={styles.mobileSearchBtn}
              onClick={() => setMobileSearchOpen(true)}
              title="بحث سريع"
              aria-label="فتح البحث السريع"
            >
              <Search size={20} />
            </button>

            {/* Desktop Live Exchange Rate Indicator */}
            {activeRate && (
              <div className={styles.rateChip} title="سعر الصرف الحالي لحساب الجنيه">
                <span className={styles.rateChipDot} />
                <span className={styles.rateChipText}>{activeRate} ج.س / درهم</span>
                <span className={styles.adminOnlyBadge}>{adminAr.brand.forAdminOnly}</span>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleToggleSound}
              title={
                soundEnabled
                  ? 'كتم التنبيه الصوتي للإشعارات'
                  : 'تفعيل التنبيه الصوتي للإشعارات الجديدة'
              }
              aria-label="تنبيه صوتي"
            >
              {soundEnabled ? (
                <Volume2 size={18} className={styles.soundActive} />
              ) : (
                <VolumeX size={18} />
              )}
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <div className={styles.pageContent} id="admin-main-content">
          {children}
        </div>
      </div>

      {/* ====================================================================
          S5: Mobile Full-Screen Search Overlay (< 768px)
          ==================================================================== */}
      {mobileSearchOpen && (
        <div
          className={styles.mobileSearchOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="البحث السريع في الإدارة"
        >
          <div className={styles.mobileSearchHeader}>
            <div className={styles.mobileSearchInputBox}>
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                className={styles.mobileSearchInput}
                placeholder="ابحث برقم الطلب، هاتف العميل، أو اسم الجهاز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label="مسح نص البحث"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              className={styles.closeSearchBtn}
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
              }}
            >
              إلغاء
            </button>
          </div>

          <div className={styles.mobileSearchResults}>
            {searchLoading ? (
              <div className={styles.searchMsg}>{adminAr.common.loading}</div>
            ) : !searchQuery.trim() ? (
              <div className={styles.searchHelperMsg}>
                يمكنك البحث بأرقام الطلبات (WEX-...) أو أرقام هواتف العملاء أو أسماء المنتجات.
              </div>
            ) : searchResults &&
              searchResults.orders.length === 0 &&
              searchResults.products.length === 0 ? (
              <div className={styles.searchMsg}>{adminAr.common.globalSearchNoResults}</div>
            ) : (
              searchResults && (
                <>
                  {searchResults.orders.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupTitle}>{adminAr.nav.orders}</div>
                      {searchResults.orders.map((ord) => (
                        <Link
                          key={ord.order_number}
                          to={`/admin/orders/${ord.order_number}`}
                          className={styles.mobileSearchItem}
                          onClick={() => {
                            setMobileSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <span className={styles.searchItemPrimary}>
                            <OrderNumber value={ord.order_number} withHash />
                          </span>
                          <span className={styles.searchItemSecondary}>
                            {ord.customer_name}{' '}
                            {ord.customer_phone && (
                              <bdi dir="ltr">({ord.customer_phone})</bdi>
                            )}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.products.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupTitle}>{adminAr.nav.products}</div>
                      {searchResults.products.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/admin/products/${prod.id}/edit`}
                          className={styles.mobileSearchItem}
                          onClick={() => {
                            setMobileSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <span className={styles.searchItemPrimary}>{prod.name}</span>
                          <span className={styles.searchItemSecondary}>
                            {prod.price_aed} ({adminAr.brand.forAdminOnly})
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          S12 & S14: Phone Bottom Tab Bar (< 768px) — Exactly 5 slots for all
          ==================================================================== */}
      <nav className={styles.bottomTabBar} aria-label="شريط التنقل الرئيسي">
        {/* Slot 1: Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>{adminAr.nav.dashboard}</span>
        </NavLink>

        {/* Slot 2: Orders */}
        <NavLink
          to="/admin/orders"
          className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}
        >
          <Package size={20} />
          <span>{adminAr.nav.orders}</span>
        </NavLink>

        {/* Slot 3: Payments */}
        <NavLink
          to="/admin/payments"
          className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}
        >
          <div className={styles.tabIconWrapper}>
            <CreditCard size={20} />
            {pendingPaymentsCount > 0 && (
              <span className={styles.tabBadge}>{pendingPaymentsCount}</span>
            )}
          </div>
          <span>{adminAr.nav.payments}</span>
        </NavLink>

        {/* Slot 4: Products for Admin, Announcements for Staff (consistent 5 slots) */}
        {isAdmin ? (
          <NavLink
            to="/admin/products"
            className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}
          >
            <Laptop size={20} />
            <span>{adminAr.nav.products}</span>
          </NavLink>
        ) : (
          <NavLink
            to="/admin/announcements"
            className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}
          >
            <Megaphone size={20} />
            <span>{adminAr.nav.announcements}</span>
          </NavLink>
        )}

        {/* Slot 5: More */}
        <button
          type="button"
          onClick={() => setMoreSheetOpen(true)}
          className={styles.tabItem}
          aria-label={adminAr.nav.more}
        >
          <Menu size={20} />
          <span>{adminAr.nav.more}</span>
        </button>
      </nav>

      {/* ====================================================================
          Mobile "More" Menu Sheet (< 768px)
          ==================================================================== */}
      <Sheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        title={adminAr.nav.more}
      >
        <div className={styles.moreSheetList}>
          {isAdmin && (
            <>
              <Link
                to="/admin/categories"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <FolderTree size={20} />
                <span>{adminAr.nav.categories}</span>
              </Link>
              <Link
                to="/admin/hero-slides"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <Sliders size={20} />
                <span>{adminAr.nav.heroSlides}</span>
              </Link>
              <Link
                to="/admin/home-sections"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <LayoutGrid size={20} />
                <span>{adminAr.nav.homeSections}</span>
              </Link>
            </>
          )}

          <Link
            to="/admin/announcements"
            className={styles.moreItem}
            onClick={() => setMoreSheetOpen(false)}
          >
            <Megaphone size={20} />
            <span>{adminAr.nav.announcements}</span>
          </Link>

          <Link
            to="/admin/recent-purchases"
            className={styles.moreItem}
            onClick={() => setMoreSheetOpen(false)}
          >
            <Activity size={20} />
            <span>{adminAr.nav.recentPurchases}</span>
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/admin/faq"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <HelpCircle size={20} />
                <span>{adminAr.nav.faq}</span>
              </Link>
              <Link
                to="/admin/pages"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <FileText size={20} />
                <span>{adminAr.nav.pages}</span>
              </Link>
              <Link
                to="/admin/payment-accounts"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <Landmark size={20} />
                <span>{adminAr.nav.paymentAccounts}</span>
              </Link>
              <Link
                to="/admin/rates"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <TrendingUp size={20} />
                <span>{adminAr.nav.rates}</span>
              </Link>
              <Link
                to="/admin/shipping-zones"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <Truck size={20} />
                <span>{adminAr.nav.shippingZones}</span>
              </Link>
              <Link
                to="/admin/settings"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <Settings size={20} />
                <span>{adminAr.nav.settings}</span>
              </Link>
              <Link
                to="/admin/users"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <Users size={20} />
                <span>{adminAr.nav.users}</span>
              </Link>
              <Link
                to="/admin/audit-logs"
                className={styles.moreItem}
                onClick={() => setMoreSheetOpen(false)}
              >
                <ScrollText size={20} />
                <span>{adminAr.nav.auditLogs}</span>
              </Link>
            </>
          )}

          <Link to="/" className={styles.moreItem} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={20} />
            <span>{adminAr.brand.storeFrontLink}</span>
          </Link>

          <button
            type="button"
            className={`${styles.moreItem} ${styles.moreLogout}`}
            onClick={async () => {
              setMoreSheetOpen(false);
              await handleLogout();
            }}
          >
            <LogOut size={20} />
            <span>{adminAr.brand.logout}</span>
          </button>
        </div>
      </Sheet>

      {/* ====================================================================
          S7: Idle Inactivity Warning Dialog with countdown and proper onCancel
          ==================================================================== */}
      <ConfirmDialog
        isOpen={isWarning}
        onClose={resetTimer}
        onConfirm={resetTimer}
        onCancel={handleIdleTimeout}
        title={adminAr.common.idleWarningTitle}
        description={`${adminAr.common.idleWarningDesc} سيتم إنهاء الجلسة تلقائياً خلال ${idleCountdown} ثانية.`}
        confirmLabel={adminAr.common.stayLoggedIn}
        cancelLabel={adminAr.brand.logout}
        variant="warning"
      />
    </div>
  );
}
