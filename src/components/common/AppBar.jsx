import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ar } from '../../content/ar';
import styles from './AppBar.module.css';

export default function AppBar({
  title,
  showLogo = false,
  showBack = false,
  backTo,
  unreadCount = 0,
  showNotifications = false,
  showCart = true,
  customAction,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const isHome = location.pathname === '/';

  return (
    <header className={styles.appBar}>
      {/* Right Section (in RTL: right side of the screen) */}
      <div className={styles.rightSection}>
        {showBack ? (
          <button
            type="button"
            className={styles.headerBtn}
            onClick={handleBack}
            aria-label={ar.common.back}
            title={ar.common.back}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
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
      </div>

      {/* Center Section: Page Title */}
      <div className={styles.titleWrapper}>
        {title && !isHome && <h1 className={styles.title}>{title}</h1>}
      </div>

      {/* Left Section (in RTL: left side of the screen) */}
      <div className={styles.leftSection}>
        {customAction}

        {/* Notifications Button (Optional, omitted on shopping funnel) */}
        {showNotifications && (
          <Link
            to="/notifications"
            className={styles.headerBtn}
            aria-label={ar.navigation.notifications}
            title={ar.navigation.notifications}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className={styles.btnBadge} aria-hidden="true" />}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
      </div>
    </header>
  );
}
