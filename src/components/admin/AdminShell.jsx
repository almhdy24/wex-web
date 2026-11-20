import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import Sheet from '../common/Sheet';
import ConfirmDialog from './ConfirmDialog';
import styles from './AdminShell.module.css';

/**
 * AdminShell
 * Three-tier adaptive administration layout:
 * - Phone (< 768px): App bar + bottom 5-tab bar + filter sheets + sticky form bars.
 * - Tablet (768-1023px): Collapsed 64px icon sidebar rail.
 * - Desktop (>= 1024px): Full 240px sidebar + top bar with global search & rate indicator.
 */
export default function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [activeRate, setActiveRate] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef(null);

  // Idle Timer
  const { isWarning, resetTimer } = useIdleTimer({
    onTimeout: async () => {
      await logout();
      navigate('/login?reason=idle');
    },
  });

  // Dynamic Admin PWA Manifest swap
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const originalHref = manifestLink?.getAttribute('href') || '/manifest.webmanifest';
    if (manifestLink) {
      manifestLink.setAttribute('href', '/admin-manifest.webmanifest');
    }
    return () => {
      if (manifestLink) {
        manifestLink.setAttribute('href', originalHref);
      }
    };
  }, []);

  // Background audio chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
      // Audio context may require explicit user gesture
    }
  };

  // 30-second Dashboard Polling
  const pollDashboard = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await adminApi.getDashboard();
      if (res.data) {
        const count = res.data.pending_reviews_count || 0;
        if (count > pendingPaymentsCount && count > 0) {
          playChime();
        }
        setPendingPaymentsCount(count);
        if (res.data.exchange_rate?.rate_sdg) {
          setActiveRate(res.data.exchange_rate.rate_sdg);
        }

        // Update document title
        if (typeof document !== 'undefined') {
          document.title = count > 0 ? `(${count}) ${adminAr.brand.name} - الإدارة` : `${adminAr.brand.name} - الإدارة`;
        }
      }
    } catch {
      // Silent error during background poll
    }
  };

  useEffect(() => {
    pollDashboard();
    const interval = setInterval(pollDashboard, 30000);
    return () => clearInterval(interval);
  }, [soundEnabled, pendingPaymentsCount]);

  // Global Search Execution
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchOpen(true);
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

  // Keyboard shortcut for search (/ or Ctrl+K)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('admin-global-search')?.focus();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSubRoute = location.pathname.split('/').filter(Boolean).length > 1;

  return (
    <div className={styles.layout}>
      {/* ====================================================================
          Desktop & Tablet Sidebar
          ==================================================================== */}
      <aside className={styles.sidebar}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>Wex <span className={styles.brandAccent}>Admin</span></span>
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
            <span className={styles.userRoleBadge}>{isAdmin ? adminAr.brand.roleAdmin : adminAr.brand.roleStaff}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={styles.navMenu} aria-label="أقسام لوحة الإدارة">
          {/* Group 1: العمليات */}
          <div className={styles.navGroupHeader}>{adminAr.nav.groupOperations}</div>
          <NavLink to="/admin" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
            <LayoutDashboard size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.dashboard}</span>
          </NavLink>

          <NavLink to="/admin/orders" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
            <Package size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.orders}</span>
          </NavLink>

          <NavLink to="/admin/payments" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
            <CreditCard size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.payments}</span>
            {pendingPaymentsCount > 0 && (
              <span className={styles.navBadge} aria-label={`${pendingPaymentsCount} إشعار قيد المراجعة`}>
                {pendingPaymentsCount}
              </span>
            )}
          </NavLink>

          {/* Group 2: المتجر */}
          {isAdmin && (
            <>
              <div className={styles.navGroupHeader}>{adminAr.nav.groupStore}</div>
              <NavLink to="/admin/products" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <Laptop size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.products}</span>
              </NavLink>

              <NavLink to="/admin/categories" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <FolderTree size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.categories}</span>
              </NavLink>
            </>
          )}

          {/* Group 3: المحتوى والواجهة */}
          <div className={styles.navGroupHeader}>{adminAr.nav.groupContent}</div>
          {isAdmin && (
            <>
              <NavLink to="/admin/hero-slides" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <Sliders size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.heroSlides}</span>
              </NavLink>

              <NavLink to="/admin/home-sections" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <LayoutGrid size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.homeSections}</span>
              </NavLink>
            </>
          )}

          <NavLink to="/admin/announcements" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
            <Megaphone size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.announcements}</span>
          </NavLink>

          <NavLink to="/admin/recent-purchases" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
            <Activity size={20} className={styles.navIcon} />
            <span className={styles.navLabel}>{adminAr.nav.recentPurchases}</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/admin/faq" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <HelpCircle size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.faq}</span>
              </NavLink>

              <NavLink to="/admin/pages" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <FileText size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.pages}</span>
              </NavLink>
            </>
          )}

          {/* Group 4: الدفع والتسعير (Admin only) */}
          {isAdmin && (
            <>
              <div className={styles.navGroupHeader}>{adminAr.nav.groupPricing}</div>
              <NavLink to="/admin/payment-accounts" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <Landmark size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.paymentAccounts}</span>
              </NavLink>

              <NavLink to="/admin/rates" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <TrendingUp size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.rates}</span>
              </NavLink>

              <NavLink to="/admin/shipping-zones" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <Truck size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.shippingZones}</span>
              </NavLink>
            </>
          )}

          {/* Group 5: النظام (Admin only) */}
          {isAdmin && (
            <>
              <div className={styles.navGroupHeader}>{adminAr.nav.groupSystem}</div>
              <NavLink to="/admin/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <Settings size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.settings}</span>
              </NavLink>

              <NavLink to="/admin/users" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <Users size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.users}</span>
              </NavLink>

              <NavLink to="/admin/audit-logs" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNav : ''}`}>
                <FileText size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{adminAr.nav.auditLogs}</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.storeLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            <span className={styles.storeLinkLabel}>{adminAr.brand.storeFrontLink}</span>
          </Link>
          <button type="button" onClick={handleLogout} className={styles.logoutBtn} aria-label="تسجيل الخروج">
            <LogOut size={16} />
            <span className={styles.logoutBtnLabel}>{adminAr.brand.logout}</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          Main Content Container
          ==================================================================== */}
      <div className={styles.mainContainer}>
        {/* Desktop Sticky Top Bar */}
        <header className={styles.topBar}>
          {/* Mobile Header Elements */}
          <div className={styles.mobileTopRow}>
            {isSubRoute && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={styles.mobileBackBtn}
                aria-label="رجوع"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <span className={styles.mobileBarTitle}>{adminAr.brand.adminTitle}</span>
          </div>

          {/* Desktop Global Search Bar */}
          <div className={styles.searchContainer}>
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
              />
              <kbd className={styles.searchKbd}>/</kbd>
            </div>

            {/* Global Search Results Dropdown */}
            {searchOpen && searchResults && (
              <div className={styles.searchDropdown} role="listbox">
                {searchLoading ? (
                  <div className={styles.searchMsg}>{adminAr.common.loading}</div>
                ) : (searchResults.orders.length === 0 && searchResults.products.length === 0) ? (
                  <div className={styles.searchMsg}>{adminAr.common.globalSearchNoResults}</div>
                ) : (
                  <>
                    {searchResults.orders.length > 0 && (
                      <div className={styles.searchGroup}>
                        <div className={styles.searchGroupTitle}>{adminAr.nav.orders}</div>
                        {searchResults.orders.map((ord) => (
                          <Link
                            key={ord.order_number}
                            to={`/admin/orders/${ord.order_number}`}
                            className={styles.searchItem}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          >
                            <span className={styles.searchItemPrimary}>#{ord.order_number}</span>
                            <span className={styles.searchItemSecondary}>{ord.customer_name} ({ord.customer_phone})</span>
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
                            className={styles.searchItem}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          >
                            <span className={styles.searchItemPrimary}>{prod.name}</span>
                            <span className={styles.searchItemSecondary}>{prod.price_aed} AED ({adminAr.brand.forAdminOnly})</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Top Bar End Actions */}
          <div className={styles.topBarActions}>
            {/* Live Exchange Rate Indicator */}
            {activeRate && (
              <div className={styles.rateChip} title="سعر الصرف المعتمد حالياً لحساب الجنيه">
                <span className={styles.rateChipDot} />
                <span className={styles.rateChipText}>
                  {activeRate} ج.س / درهم
                </span>
                <span className={styles.adminOnlyBadge}>{adminAr.brand.forAdminOnly}</span>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? 'كتم التنبيه الصوتي للإشعارات' : 'تفعيل التنبيه الصوتي للإشعارات الجديدة'}
              aria-label="تنبيه صوتي"
            >
              {soundEnabled ? <Volume2 size={18} className={styles.soundActive} /> : <VolumeX size={18} />}
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className={styles.pageContent} id="admin-main-content">
          {children}
        </main>
      </div>

      {/* ====================================================================
          Phone Bottom Tab Bar (< 768px)
          ==================================================================== */}
      <nav className={styles.bottomTabBar} aria-label="شريط التنقل الرئيسي">
        <NavLink to="/admin" end className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}>
          <LayoutDashboard size={20} />
          <span>{adminAr.nav.dashboard}</span>
        </NavLink>

        <NavLink to="/admin/orders" className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}>
          <Package size={20} />
          <span>{adminAr.nav.orders}</span>
        </NavLink>

        <NavLink to="/admin/payments" className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}>
          <div className={styles.tabIconWrapper}>
            <CreditCard size={20} />
            {pendingPaymentsCount > 0 && (
              <span className={styles.tabBadge}>{pendingPaymentsCount}</span>
            )}
          </div>
          <span>{adminAr.nav.payments}</span>
        </NavLink>

        {isAdmin ? (
          <NavLink to="/admin/products" className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.activeTab : ''}`}>
            <Laptop size={20} />
            <span>{adminAr.nav.products}</span>
          </NavLink>
        ) : (
          <button type="button" onClick={() => setMoreSheetOpen(true)} className={styles.tabItem}>
            <Menu size={20} />
            <span>{adminAr.nav.more}</span>
          </button>
        )}

        {isAdmin && (
          <button type="button" onClick={() => setMoreSheetOpen(true)} className={styles.tabItem}>
            <Menu size={20} />
            <span>{adminAr.nav.more}</span>
          </button>
        )}
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
              <Link to="/admin/categories" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <FolderTree size={20} />
                <span>{adminAr.nav.categories}</span>
              </Link>
              <Link to="/admin/hero-slides" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <Sliders size={20} />
                <span>{adminAr.nav.heroSlides}</span>
              </Link>
              <Link to="/admin/home-sections" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <LayoutGrid size={20} />
                <span>{adminAr.nav.homeSections}</span>
              </Link>
            </>
          )}

          <Link to="/admin/announcements" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
            <Megaphone size={20} />
            <span>{adminAr.nav.announcements}</span>
          </Link>

          <Link to="/admin/recent-purchases" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
            <Activity size={20} />
            <span>{adminAr.nav.recentPurchases}</span>
          </Link>

          {isAdmin && (
            <>
              <Link to="/admin/faq" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <HelpCircle size={20} />
                <span>{adminAr.nav.faq}</span>
              </Link>
              <Link to="/admin/pages" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <FileText size={20} />
                <span>{adminAr.nav.pages}</span>
              </Link>
              <Link to="/admin/payment-accounts" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <Landmark size={20} />
                <span>{adminAr.nav.paymentAccounts}</span>
              </Link>
              <Link to="/admin/rates" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <TrendingUp size={20} />
                <span>{adminAr.nav.rates}</span>
              </Link>
              <Link to="/admin/shipping-zones" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <Truck size={20} />
                <span>{adminAr.nav.shippingZones}</span>
              </Link>
              <Link to="/admin/settings" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <Settings size={20} />
                <span>{adminAr.nav.settings}</span>
              </Link>
              <Link to="/admin/users" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <Users size={20} />
                <span>{adminAr.nav.users}</span>
              </Link>
              <Link to="/admin/audit-logs" className={styles.moreItem} onClick={() => setMoreSheetOpen(false)}>
                <FileText size={20} />
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
          Idle Inactivity Warning Dialog (25 Minutes)
          ==================================================================== */}
      <ConfirmDialog
        isOpen={isWarning}
        onClose={resetTimer}
        onConfirm={resetTimer}
        title={adminAr.common.idleWarningTitle}
        description={adminAr.common.idleWarningDesc}
        confirmLabel={adminAr.common.stayLoggedIn}
        cancelLabel={adminAr.brand.logout}
        variant="warning"
      />
    </div>
  );
}
