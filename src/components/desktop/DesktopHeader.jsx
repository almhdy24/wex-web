import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  Bell,
  ShoppingBag,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  LogOut,
  Package,
  Sliders,
  Heart,
} from 'lucide-react';
import Popover from '../common/Popover';
import LaptopSvg from '../common/LaptopSvg';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { productsApi } from '../../api/products';
import { notificationsApi } from '../../api/notifications';
import { formatSdg, formatDate } from '../../utils/formatters';
import { prefetchRoute } from '../../utils/prefetch';
import { ar } from '../../content/ar';
import styles from './DesktopHeader.module.css';

const RECENT_SEARCHES_KEY = 'wex_recent_searches_desktop';

export default function DesktopHeader({ onOpenCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { favoriteCount } = useFavorites();
  const { user, isAuthenticated, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : ['Dell Latitude', 'Lenovo ThinkPad', 'شاحن حاسوب'];
    } catch {
      return ['Dell Latitude', 'Lenovo ThinkPad', 'شاحن حاسوب'];
    }
  });

  // Popover states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const notifBtnRef = useRef(null);
  const accountBtnRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Scroll detection for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread notifications count
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
  }, [isAuthenticated, location.pathname]);

  // Load recent notifications on popover open
  useEffect(() => {
    if (!isNotificationsOpen || !isAuthenticated) return;
    let isMounted = true;
    setIsLoadingNotifications(true);
    notificationsApi.getNotifications({ limit: 5 })
      .then((res) => {
        if (isMounted) {
          setNotifications(res?.data || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingNotifications(false);
      });
    return () => { isMounted = false; };
  }, [isNotificationsOpen, isAuthenticated]);

  // Debounced search query handler
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      productsApi.getProducts({ search: trimmed, per_page: 6 })
        .then((res) => {
          setSearchResults(res?.data || []);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const saveRecentSearch = (term) => {
    if (!term || typeof term !== 'string') return;
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // LocalStorage unavailable
      }
      return updated;
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setIsSearchFocused(false);
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectProduct = (product) => {
    saveRecentSearch(product.name);
    setIsSearchFocused(false);
    setSearchQuery('');
    navigate(`/products/${product.slug || product.id}`);
  };

  const handleSelectRecent = (term) => {
    setSearchQuery(term);
    saveRecentSearch(term);
    setIsSearchFocused(false);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  // Khartoum Working Hours Calculation (UTC+2)
  const shopStatus = getKhartoumShopStatus();

  return (
    <>
      {/* Top Status Strip */}
      <div className={styles.topStrip}>
        <div className={styles.topStripContainer}>
          <div className={styles.topStripStart}>
            <span
              className={`${styles.statusBadge} ${shopStatus.isOpen ? styles.statusOpen : styles.statusClosed}`}
            >
              <span className={styles.statusDot} />
              {shopStatus.isOpen ? ar.desktop.statusOpen : ar.desktop.statusClosed}
            </span>
            <span className={styles.hoursText}>
              <Clock size={13} className={styles.stripIcon} />
              {ar.desktop.shopHoursShort}
            </span>
            <span className={styles.divider}>•</span>
            <span className={styles.locationText}>
              <MapPin size={13} className={styles.stripIcon} />
              {ar.desktop.locationShort}
            </span>
          </div>

          <div className={styles.topStripEnd}>
            <a
              href="https://wa.me/249912345678"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.topContactLink}
              title={ar.desktop.whatsapp}
            >
              <MessageCircle size={13} className={styles.stripIcon} />
              <span>{ar.desktop.whatsapp}</span>
            </a>
            <span className={styles.divider}>•</span>
            <a href="tel:+249912345678" className={styles.topContactLink} title="اتصل بنا">
              <Phone size={13} className={styles.stripIcon} />
              <span>{ar.desktop.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerContainer}>
          {/* Brand Logo */}
          <Link to="/" className={styles.logoLink} aria-label={ar.common.appName}>
            <img
              src="/assets/logo.png"
              alt={ar.common.appName}
              className={styles.logoImg}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>

          {/* Primary Navigation */}
          <nav className={styles.navBar} aria-label="التنقل الرئيسي">
            <NavLink
              to="/"
              end
              onMouseEnter={() => prefetchRoute('/')}
              onFocus={() => prefetchRoute('/')}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {ar.navigation.home}
            </NavLink>
            <NavLink
              to="/products"
              end
              onMouseEnter={() => prefetchRoute('/products')}
              onFocus={() => prefetchRoute('/products')}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {ar.navigation.catalog}
            </NavLink>
            <NavLink
              to="/products?category=accessories"
              onMouseEnter={() => prefetchRoute('/products')}
              onFocus={() => prefetchRoute('/products')}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive && location.search.includes('accessories') ? styles.navLinkActive : ''}`
              }
            >
              {ar.navigation.accessories}
            </NavLink>
            <NavLink
              to="/orders"
              onMouseEnter={() => prefetchRoute('/orders')}
              onFocus={() => prefetchRoute('/orders')}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {ar.navigation.orders}
            </NavLink>
          </nav>

          {/* Wide Center Search Field */}
          <div ref={searchContainerRef} className={styles.searchContainer}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={ar.desktop.searchPlaceholder}
                className={styles.searchInput}
                aria-label={ar.desktop.searchPlaceholder}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label="مسح البحث"
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Instant Suggestions Dropdown */}
            {isSearchFocused && (
              <>
                <div
                  className={styles.searchBackdrop}
                  onClick={() => setIsSearchFocused(false)}
                />
                <div className={styles.suggestionsBox}>
                  {isSearching ? (
                    <div className={styles.searchLoading}>
                      <span className={styles.searchSpinner} />
                      <span>{ar.common.loading}</span>
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    searchResults.length > 0 ? (
                      <div className={styles.resultsList}>
                        <div className={styles.dropdownHeading}>نتائج البحث المقترحة</div>
                        {searchResults.map((prod) => (
                          <div
                            key={prod.id}
                            className={styles.resultItem}
                            onClick={() => handleSelectProduct(prod)}
                          >
                            <div className={styles.resultThumb}>
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className={styles.thumbImg} />
                              ) : (
                                <LaptopSvg width={36} height={24} />
                              )}
                            </div>
                            <div className={styles.resultInfo}>
                              <span className={styles.resultName}>{prod.name}</span>
                              <span className={styles.resultPrice}>{formatSdg(prod.price_sdg)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyResults}>
                        <span>لم نجد أجهزة مطابقة للبحث</span>
                      </div>
                    )
                  ) : (
                    <div className={styles.recentBox}>
                      <div className={styles.dropdownHeading}>{ar.home.recentSearches}</div>
                      <div className={styles.recentChips}>
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            className={styles.recentChip}
                            onClick={() => handleSelectRecent(term)}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Icons Section */}
          <div className={styles.actionsSection}>
            {/* Notifications Popover Button */}
            <div className={styles.actionBtnWrapper}>
              <button
                ref={notifBtnRef}
                type="button"
                className={styles.iconBtn}
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label={ar.desktop.notificationsTitle}
                title={ar.desktop.notificationsTitle}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.unreadDot} />}
              </button>

              <Popover
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                anchorRef={notifBtnRef}
                align="end"
                width="340px"
                ariaLabel={ar.desktop.notificationsTitle}
              >
                <div className={styles.popoverHeader}>
                  <h3 className={styles.popoverTitle}>{ar.desktop.notificationsTitle}</h3>
                  {unreadCount > 0 && (
                    <span className={styles.unreadCountBadge}>{unreadCount} جديد</span>
                  )}
                </div>

                <div className={styles.notificationsList}>
                  {!isAuthenticated ? (
                    <div className={styles.popoverEmpty}>
                      <p>سجّل الدخول للاطلاع على تنبيهات طلباتك.</p>
                      <Link
                        to="/login"
                        className={styles.popoverLoginBtn}
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        {ar.desktop.loginNow}
                      </Link>
                    </div>
                  ) : isLoadingNotifications ? (
                    <div className={styles.popoverLoading}>
                      <span>{ar.common.loading}</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className={styles.popoverEmpty}>
                      <p>{ar.desktop.noNotifications}</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`${styles.notifItem} ${!notif.read_at ? styles.notifUnread : ''}`}
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          if (notif.order_id) navigate(`/orders/${notif.order_id}`);
                        }}
                      >
                        <div className={styles.notifTitle}>{notif.title}</div>
                        <div className={styles.notifMessage}>{notif.message}</div>
                        <div className={styles.notifDate}>{formatDate(notif.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>

                {isAuthenticated && (
                  <div className={styles.popoverFooter}>
                    <Link
                      to="/notifications"
                      className={styles.viewAllLink}
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                      {ar.desktop.viewAllNotifications}
                    </Link>
                  </div>
                )}
              </Popover>
            </div>

            {/* Wishlist Button */}
            <Link
              to="/favorites"
              className={styles.iconBtn}
              aria-label={`${ar.wishlist?.title || 'المفضلة'} ${favoriteCount > 0 ? `(${favoriteCount})` : ''}`}
              title={ar.wishlist?.title || 'المفضلة'}
            >
              <Heart size={20} />
              {favoriteCount > 0 && (
                <span className={styles.cartBadge}>
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </Link>

            {/* Cart Drawer Trigger Button */}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onOpenCart}
              aria-label={`${ar.desktop.cartDrawerTitle} (${totalItems})`}
              title={ar.desktop.cartDrawerTitle}
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className={styles.cartBadge}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Account Menu Popover */}
            <div className={styles.actionBtnWrapper}>
              <button
                ref={accountBtnRef}
                type="button"
                className={`${styles.iconBtn} ${styles.accountBtn}`}
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                aria-label={ar.desktop.accountMenu}
                title={ar.desktop.accountMenu}
              >
                {user?.name ? (
                  <span className={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <User size={20} />
                )}
              </button>

              <Popover
                isOpen={isAccountMenuOpen}
                onClose={() => setIsAccountMenuOpen(false)}
                anchorRef={accountBtnRef}
                align="end"
                width="280px"
                ariaLabel={ar.desktop.accountMenu}
              >
                {isAuthenticated && user ? (
                  <div className={styles.accountMenuContent}>
                    <div className={styles.userBrief}>
                      <div className={styles.userName}>{user.name || 'عميل ويكس'}</div>
                      <div className={styles.userPhone}>{user.phone || user.email}</div>
                    </div>

                    <div className={styles.menuLinks}>
                      <Link
                        to="/orders"
                        className={styles.menuItem}
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <Package size={17} />
                        <span>{ar.desktop.myOrders}</span>
                      </Link>

                      <Link
                        to="/favorites"
                        className={styles.menuItem}
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <Heart size={17} />
                        <span>{ar.wishlist?.title || 'المفضلة'}</span>
                        {favoriteCount > 0 && (
                          <span className={styles.unreadCountBadge} style={{ marginInlineStart: 'auto' }}>
                            {favoriteCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/account"
                        className={styles.menuItem}
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <Sliders size={17} />
                        <span>{ar.desktop.profile}</span>
                      </Link>

                      <button
                        type="button"
                        className={`${styles.menuItem} ${styles.logoutItem}`}
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          logout();
                        }}
                      >
                        <LogOut size={17} />
                        <span>{ar.desktop.logout}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.guestMenuContent}>
                    <div className={styles.guestTitle}>أهلاً بك في ويكس تكنولوجي</div>
                    <p className={styles.guestDesc}>سجّل الدخول لتتبّع طلباتك وتثبيت الأسعار فور الطلب.</p>
                    <Link
                      to="/login"
                      className={styles.guestLoginBtn}
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      {ar.desktop.loginNow}
                    </Link>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                      <Link
                        to="/favorites"
                        className={styles.menuItem}
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <Heart size={17} />
                        <span>{ar.wishlist?.title || 'المفضلة'}</span>
                        {favoriteCount > 0 && (
                          <span className={styles.unreadCountBadge} style={{ marginInlineStart: 'auto' }}>
                            {favoriteCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                )}
              </Popover>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

// Calculate Khartoum shop status (UTC+2)
function getKhartoumShopStatus() {
  if (typeof window === 'undefined') {
    return { isOpen: true, text: 'مفتوح الآن' };
  }
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const khartoum = new Date(utc + 2 * 3600000);
  const day = khartoum.getDay(); // 0 is Sun, 5 is Fri
  const hour = khartoum.getHours();

  if (day === 5) {
    return { isOpen: false, text: 'مغلق حاليًا' };
  }
  const isOpen = hour >= 9 && hour < 21;
  return { isOpen, text: isOpen ? 'مفتوح الآن' : 'مغلق حاليًا' };
}
