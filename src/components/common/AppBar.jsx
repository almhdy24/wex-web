import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Bell, Heart, ShoppingCart } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { FavoritesContext } from '../../context/FavoritesContext';
import { ar } from '../../content/ar';
import BrandRibbons from './BrandRibbons';
import styles from './AppBar.module.css';

export default function AppBar({
  title,
  subtitle,
  showLogo = false,
  showBack = false,
  backTo,
  unreadCount = 0,
  showNotifications = false,
  showWishlist = false,
  showCart = true,
  customAction,
  tone = 'light',
  overlap,
  titleAs = 'h1',
  className = '',
  style = {},
  headerContent,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useContext(CartContext);
  const totalItems = cart?.totalItems ?? 0;
  const fav = useContext(FavoritesContext);
  const favoriteCount = fav?.favoriteCount ?? 0;

  const handleBack = () => {
    if (window.history && window.history.length > 1) {
      navigate(-1);
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate('/');
    }
  };

  const isHome = location.pathname === '/';
  const isNavy = tone === 'navy';
  const TitleTag = titleAs || 'h1';

  const overlapValue = overlap !== undefined
    ? (typeof overlap === 'number' ? `${overlap}px` : overlap)
    : undefined;

  const combinedStyle = {
    ...(overlapValue ? { '--appbar-overlap': overlapValue, '--header-bottom': overlapValue } : {}),
    ...style,
  };

  return (
    <header className={`${styles.appBar} ${isNavy ? styles.navy : ''} ${className}`} style={combinedStyle}>
      {isNavy && <BrandRibbons variant="header" />}
      <div className={styles.headerRow}>
        {/* Right Section (in RTL: right / start side of screen) */}
        <div className={styles.rightSection}>
          {showBack ? (
            <button
              type="button"
              className={styles.headerBtn}
              onClick={handleBack}
              aria-label={ar.common.back}
              title={ar.common.back}
            >
              <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : showLogo || isHome ? (
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
          ) : null}

          {isNavy && title && (
            <div className={styles.navyTitleWrapper}>
              {/* Desktop only: where am I. The mobile back button is hidden there. */}
              {typeof title === 'string' && (
                <nav className={styles.crumbs} aria-label="مسار التنقل">
                  <Link to="/">{ar.navigation.home || 'الرئيسية'}</Link>
                  <span aria-hidden="true">‹</span>
                  <span aria-current="page">{title}</span>
                </nav>
              )}
              <TitleTag className={styles.title}>{title}</TitleTag>
              {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            </div>
          )}
        </div>

        {/* Center Section: Page Title (for light tone) */}
        {!isNavy && (
          <div className={styles.titleWrapper}>
            {title && !isHome && <TitleTag className={styles.title}>{title}</TitleTag>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
        )}

        {/* Left Section (in RTL: left / end side of screen) */}
        <div className={styles.leftSection}>
          {customAction}

          {/* Notifications Button */}
          {showNotifications && (
            <Link
              to="/notifications"
              className={styles.headerBtn}
              aria-label={ar.navigation.notifications}
              title={ar.navigation.notifications}
            >
              <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
              {unreadCount > 0 && <span className={styles.btnBadge} aria-hidden="true" />}
            </Link>
          )}

          {/* Wishlist Button */}
          {showWishlist && (
            <Link
              to="/favorites"
              id="app-bar-wishlist-btn"
              className={styles.headerBtn}
              aria-label={`${ar.wishlist?.title || 'المفضلة'} ${favoriteCount > 0 ? `(${favoriteCount})` : ''}`}
              title={ar.wishlist?.title || 'المفضلة'}
            >
              <Heart size={20} strokeWidth={1.75} aria-hidden="true" />
              {favoriteCount > 0 && (
                <span key={favoriteCount} className={styles.cartCountBadge}>
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </Link>
          )}

          {/* Shopping Cart Button */}
          {showCart && (
            <Link
              to="/cart"
              id="app-bar-cart-btn"
              className={styles.headerBtn}
              aria-label={`${ar.navigation.cart} ${totalItems > 0 ? `(${totalItems})` : ''}`}
              title={ar.navigation.cart}
            >
              <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
              {totalItems > 0 && (
                <span key={totalItems} className={styles.cartCountBadge}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          )}

          {children}
        </div>
      </div>
      {headerContent && <div className={styles.headerContent}>{headerContent}</div>}
    </header>
  );
}
