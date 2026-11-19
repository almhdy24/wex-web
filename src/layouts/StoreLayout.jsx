import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { notificationsApi } from '../api/notifications';
import PwaPrompt from '../components/common/PwaPrompt';

export default function StoreLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

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
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-slate-50)' }}>
      {/* Top Banner / Location & Guarantee */}
      <div
        style={{
          backgroundColor: 'var(--color-navy)',
          color: 'var(--color-slate-200)',
          fontSize: '12px',
          padding: '6px var(--space-4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span>مول الواحة - الشهداء - أم درمان</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>من 10 صباحاً إلى 10 مساءً</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>
              تثبيت سعر الصرف لمدة 4 ساعات عند الطلب
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        style={{
          backgroundColor: 'var(--color-white)',
          borderBottom: '1px solid var(--color-slate-200)',
          position: 'sticky',
          top: 0,
          zIndex: 900,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            height: 64,
          }}
        >
          {/* Brand Logo from Mockup */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              padding: '4px',
            }}
          >
            <img
              src="/assets/logo.png"
              alt="Wex Technology"
              style={{
                display: 'block',
                minWidth: 120,
                width: 132,
                maxWidth: 160,
                height: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.outerHTML = '<span style="font-size:22px;font-weight:900;color:var(--color-navy);">Wex</span>';
              }}
            />
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              maxWidth: 440,
              display: 'none',
              position: 'relative',
            }}
            className="header-search-form"
          >
            <input
              type="search"
              className="form-input"
              placeholder="ابحث عن لابتوب، مواصفات، أو ملحقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 38,
                paddingRight: 16,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-slate-100)',
                borderColor: 'var(--color-slate-200)',
                fontSize: '13px',
                height: 40,
              }}
            />
            <button
              type="submit"
              className="btn btn-ghost"
              aria-label="بحث"
              style={{
                position: 'absolute',
                left: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                padding: 4,
                minHeight: 'unset',
                color: 'var(--color-slate-500)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <NavLink
              to="/products"
              style={({ isActive }) => ({
                fontWeight: 700,
                fontSize: '13px',
                color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-700)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
              })}
            >
              الأجهزة المتوفرة
            </NavLink>

            {/* Notifications (if authenticated) */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="header-btn"
                title="الإشعارات"
                style={{ position: 'relative' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className="btn-badge" />}
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="btn btn-outline btn-sm"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 'var(--radius-full)',
                borderColor: 'var(--color-slate-300)',
                padding: '6px 14px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="cart-label" style={{ fontWeight: 700, fontSize: '13px' }}>السلة</span>
              {totalItems > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-cyan)',
                    color: 'var(--color-navy)',
                    fontSize: '11px',
                    fontWeight: 800,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {user?.role && (user.role === 'admin' || user.role === 'staff') && (
                  <Link
                    to="/admin"
                    className="btn btn-navy btn-sm"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    لوحة الإدارة
                  </Link>
                )}
                <Link
                  to="/account"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  حسابي
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary btn-sm"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-8))' }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar from Mockup */}
      <nav
        className="bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(11, 63, 191, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 800,
          boxShadow: '0 -4px 16px rgba(6, 26, 85, 0.06)',
        }}
      >
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-400)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span style={{ marginTop: 2 }}>الرئيسية</span>
        </NavLink>

        <NavLink
          to="/products"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-400)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span style={{ marginTop: 2 }}>الأجهزة</span>
        </NavLink>

        <NavLink
          to="/cart"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-400)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            position: 'relative',
            padding: '4px 12px',
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span style={{ marginTop: 2 }}>السلة</span>
          {totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 12,
                backgroundColor: 'var(--color-cyan)',
                color: 'var(--color-navy)',
                fontSize: '10px',
                fontWeight: 800,
                borderRadius: 'var(--radius-full)',
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {totalItems}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/orders"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-400)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span style={{ marginTop: 2 }}>طلباتي</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? '/account' : '/login'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-400)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ marginTop: 2 }}>{isAuthenticated ? 'حسابي' : 'دخول'}</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'var(--color-navy)',
          color: 'var(--color-slate-300)',
          padding: 'var(--space-12) 0 var(--space-8)',
          marginTop: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-8)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <img
                  src="/assets/logo.png"
                  alt="Wex Technology"
                  style={{
                    filter: 'brightness(0) invert(1)',
                    width: 140,
                    height: 'auto',
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <p style={{ color: 'var(--color-slate-300)', fontSize: '13px', lineHeight: 1.7 }}>
                متجر إلكترونيات في أم درمان متخصص في أجهزة اللابتوب المستوردة الأصلية، الهواتف الذكية، والملحقات، مع تثبيت السعر عند الطلب وضمان المحل.
              </p>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)', fontSize: '14px', fontWeight: 800 }}>
                روابط سريعة
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '13px' }}>
                <li><Link to="/products" style={{ color: 'var(--color-slate-300)' }}>جميع الأجهزة</Link></li>
                <li><Link to="/products?type=laptop" style={{ color: 'var(--color-slate-300)' }}>أجهزة اللابتوب</Link></li>
                <li><Link to="/products?type=accessory" style={{ color: 'var(--color-slate-300)' }}>الملحقات والإكسسوارات</Link></li>
                <li><Link to="/orders" style={{ color: 'var(--color-slate-300)' }}>متابعة حالة الطلب</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)', fontSize: '14px', fontWeight: 800 }}>
                موقع المحل وتواصل معنا
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '13px' }}>
                <div>مول الواحة، الشهداء، أم درمان</div>
                <div>هاتف: +249 9XX XXX XXX</div>
                <div>
                  <a
                    href="https://wa.me/249912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#25D366', fontWeight: 700 }}
                  >
                    تواصل معنا عبر واتساب مباشرة
                  </a>
                </div>
                <div>ساعات العمل: 10 صباحاً - 10 مساءً (الجمعة عطلة)</div>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              fontSize: '12px',
              color: 'var(--color-slate-400)',
            }}
          >
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} ويكس تكنولوجي (Wex Technology).
            </div>
            <div>
              أم درمان - السودان
            </div>
          </div>
        </div>
      </footer>

      <PwaPrompt />

      <style>{`
        @media (min-width: 768px) {
          .header-search-form {
            display: block !important;
          }
          .bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
