import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
              {isNavy ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
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
              <svg width={isNavy ? '22' : '20'} height={isNavy ? '22' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isNavy ? '1.75' : '2'} aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
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
              <svg width={isNavy ? '22' : '20'} height={isNavy ? '22' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isNavy ? '1.75' : '2'} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
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
              <svg width={isNavy ? '22' : '20'} height={isNavy ? '22' : '20'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isNavy ? '1.75' : '2'} aria-hidden="true">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
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
    </header>
  );
}
