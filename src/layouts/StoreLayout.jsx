import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ShoppingBag, Home, LayoutGrid, Package, User, MapPin, Clock, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { notificationsApi } from '../api/notifications';
import { productsApi } from '../api/products';
import PwaPrompt from '../components/common/PwaPrompt';
import styles from './StoreLayout.module.css';

export default function StoreLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shopRate, setShopRate] = useState(650);

  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Load shop exchange rate
  useEffect(() => {
    productsApi.getShopInfo()
      .then((res) => {
        if (res?.data?.rate_sdg) {
          setShopRate(res.data.rate_sdg);
        }
      })
      .catch(() => {});
  }, []);

  // Load unread notifications count if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;
    notificationsApi.getUnreadCount()
      .then((res) => {
        if (isMounted) setUnreadCount(res?.data?.unread_count || 0);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  // Hide bottom navigation on checkout and product detail pages where sticky bars exist
  const hideBottomNav = location.pathname.startsWith('/checkout') ||
    (location.pathname.startsWith('/products/') && location.pathname !== '/products');

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          {/* Brand Logo */}
          <Link to="/" className={styles.logoLink} aria-label="الرئيسية - ويكس تكنولوجي">
            <img
              src="/assets/logo.png"
              alt="Wex Technology"
              className={styles.logo}
              width="130"
              height="38"
            />
          </Link>

          {/* Desktop Search */}
          <div className={styles.searchDesktop}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm} role="search">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن لابتوب أو ملحق..."
                className={styles.searchInput}
                aria-label="البحث عن المنتجات"
              />
              <button type="submit" className={styles.searchBtn} aria-label="بحث">
                <Search size={18} strokeWidth={1.75} />
              </button>
            </form>
          </div>

          {/* Actions: Search Toggle (Mobile), Notifications, Cart */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.mobileSearchBtn}
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="فتح شريط البحث"
              aria-expanded={mobileSearchOpen}
            >
              <Search size={20} strokeWidth={1.75} />
            </button>

            {isAuthenticated && (
              <Link to="/notifications" className={styles.iconBtn} aria-label="الإشعارات">
                <Bell size={20} strokeWidth={1.75} />
                {unreadCount > 0 && <span className={styles.unreadDot} aria-hidden="true" />}
              </Link>
            )}

            <Link to="/cart" className={styles.iconBtn} aria-label={`سلة المشتريات (${totalItems} عنصر)`}>
              <ShoppingBag size={20} strokeWidth={1.75} />
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Expandable Drawer */}
        {mobileSearchOpen && (
          <div className={styles.mobileSearchDrawer}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm} role="search">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن لابتوب أو ملحق..."
                className={styles.searchInput}
                autoFocus
              />
              <button type="submit" className={styles.searchBtn} aria-label="بحث">
                <Search size={18} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        )}

        {/* Thin Exchange Rate Strip */}
        <div className={styles.rateStrip}>
          <div className={`container ${styles.rateStripInner}`}>
            <div className={styles.rateValue}>
              <span className={styles.rateDot} aria-hidden="true" />
              <span>الدرهم اليوم {shopRate} جنيه</span>
            </div>
            <div className={styles.rateTimestamp}>
              تحديث: اليوم 9:00
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className={`${styles.main} ${hideBottomNav ? styles.noBottomNav : ''}`}>
        <Outlet />
      </main>

      {/* Plain, Honest Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <div className={styles.footerHeading}>ويكس تكنولوجي (Wex Technology)</div>
              <p>متجر أجهزة لابتوب وموبايلات وملحقات في أم درمان. بنوفر أسعار واضحة ومثبتة بعد الطلب.</p>
              <div className={styles.footerItem}>
                <MapPin size={16} strokeWidth={1.75} />
                <span>مول الواحة - الشهداء - أم درمان</span>
              </div>
              <div className={styles.footerItem}>
                <Clock size={16} strokeWidth={1.75} />
                <span>السبت إلى الخميس: 9:00 صباحاً - 9:00 مساءً</span>
              </div>
            </div>

            <div className={styles.footerCol}>
              <div className={styles.footerHeading}>تواصل معنا</div>
              <a href="tel:0912345678" className={styles.footerItem}>
                <Phone size={16} strokeWidth={1.75} />
                <span dir="ltr">0912345678</span>
              </a>
              <a
                href="https://wa.me/249912345678"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerItem}
              >
                <MessageSquare size={16} strokeWidth={1.75} />
                <span>واتساب المتجر</span>
              </a>
            </div>

            <div className={styles.footerCol}>
              <div className={styles.footerHeading}>روابط سريعة</div>
              <div className={styles.footerLinks}>
                <Link to="/products">كتالوج الأجهزة</Link>
                <Link to="/orders">متابعة طلب</Link>
                <Link to="/account">حسابي</Link>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>جميع الحقوق محفوظة © {new Date().getFullYear()} ويكس تكنولوجي</div>
            <div>أم درمان - السودان</div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (4 tabs) */}
      {!hideBottomNav && (
        <nav className={styles.bottomNav} aria-label="التنقل الأساسي">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
          >
            <Home size={20} strokeWidth={1.75} />
            <span>الرئيسية</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
          >
            <LayoutGrid size={20} strokeWidth={1.75} />
            <span>المتجر</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
          >
            <Package size={20} strokeWidth={1.75} />
            <span>طلباتي</span>
          </NavLink>

          <NavLink
            to={isAuthenticated ? '/account' : '/login'}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
          >
            <User size={20} strokeWidth={1.75} />
            <span>حسابي</span>
          </NavLink>
        </nav>
      )}

      {/* PWA Prompt */}
      <PwaPrompt />
    </div>
  );
}
