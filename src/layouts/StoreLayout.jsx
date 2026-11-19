import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function StoreLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Banner / Exchange Rate Info */}
      <div
        style={{
          backgroundColor: 'var(--color-navy-dark)',
          color: 'var(--color-slate-300)',
          fontSize: 'var(--text-xs)',
          padding: 'var(--space-1) var(--space-4)',
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
            <span>📍 أم درمان - مول الواحة، الشهداء</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>🕒 من 10 ص إلى 10 م</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>
              🛡️ تثبيت سعر الصرف لمدة 4 ساعات عند الطلب
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
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            height: 'var(--header-height)',
          }}
        >
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-white)',
                fontWeight: 800,
                fontSize: '1.25rem',
                border: '2px solid var(--color-royal-blue)',
              }}
            >
              W
            </div>
            <div>
              <div
                style={{
                  color: 'var(--color-navy)',
                  fontWeight: 800,
                  fontSize: 'var(--text-lg)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                Wex <span style={{ color: 'var(--color-cyan)' }}>Technology</span>
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--color-slate-500)',
                  fontWeight: 600,
                }}
              >
                ويكس تكنولوجي - إلكترونيات ولابتوبات
              </div>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              maxWidth: 480,
              display: 'none',
              position: 'relative',
            }}
            className="header-search-form"
          >
            <input
              type="search"
              className="form-input"
              placeholder="ابحث عن لابتوب، هاتف، أو ملحقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 'var(--space-10)',
                paddingRight: 'var(--space-4)',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-slate-100)',
                borderColor: 'var(--color-slate-200)',
              }}
            />
            <button
              type="submit"
              className="btn btn-ghost"
              aria-label="بحث"
              style={{
                position: 'absolute',
                left: 'var(--space-2)',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: 'var(--space-1)',
                minHeight: 'unset',
              }}
            >
              🔍
            </button>
          </form>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active-link' : ''}`
              }
              style={{
                fontWeight: 600,
                fontSize: varStyle('text-sm'),
                color: 'var(--color-slate-700)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              الأجهزة والمنتجات
            </NavLink>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="btn btn-outline btn-sm"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                borderRadius: 'var(--radius-full)',
                borderColor: 'var(--color-slate-300)',
              }}
            >
              <span>🛒</span>
              <span className="cart-label" style={{ fontWeight: 600 }}>السلة</span>
              {totalItems > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-royal-blue)',
                    color: 'var(--color-white)',
                    fontSize: '11px',
                    fontWeight: 700,
                    minWidth: 20,
                    height: 20,
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
                    style={{ fontSize: 'var(--text-xs)' }}
                  >
                    لوحة التحكم
                  </Link>
                )}
                <Link
                  to="/account"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  حسابي
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary btn-sm"
                style={{ fontSize: 'var(--text-xs)' }}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--bottom-nav-height)',
          backgroundColor: 'var(--color-white)',
          borderTop: '1px solid var(--color-slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 800,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
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
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-500)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <span style={{ fontSize: '18px' }}>🏠</span>
          <span>الرئيسية</span>
        </NavLink>

        <NavLink
          to="/products"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-500)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <span style={{ fontSize: '18px' }}>💻</span>
          <span>الأجهزة</span>
        </NavLink>

        <NavLink
          to="/cart"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-500)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            position: 'relative',
            padding: '4px 12px',
          })}
        >
          <span style={{ fontSize: '18px' }}>🛒</span>
          <span>السلة</span>
          {totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 14,
                backgroundColor: 'var(--color-royal-blue)',
                color: 'var(--color-white)',
                fontSize: '10px',
                fontWeight: 700,
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
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-500)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <span style={{ fontSize: '18px' }}>📦</span>
          <span>طلباتي</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? "/account" : "/login"}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            color: isActive ? 'var(--color-royal-blue)' : 'var(--color-slate-500)',
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            padding: '4px 12px',
          })}
        >
          <span style={{ fontSize: '18px' }}>👤</span>
          <span>{isAuthenticated ? 'حسابي' : 'دخول'}</span>
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
            {/* Col 1: Brand Info */}
            <div>
              <div
                style={{
                  color: 'var(--color-white)',
                  fontWeight: 800,
                  fontSize: 'var(--text-xl)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Wex <span style={{ color: 'var(--color-cyan)' }}>Technology</span>
              </div>
              <p style={{ color: 'var(--color-slate-300)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                متجر إلكترونيات رائد في أم درمان، السودان. متخصصون في أجهزة اللابتوب المستوردة الأصلية، الهواتف الذكية، والإكسسوارات المعتمدة، مع تثبيت السعر عند الطلب وضمان حقيقي.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                روابط سريعة
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <li><Link to="/products" style={{ color: 'var(--color-slate-300)' }}>جميع الأجهزة</Link></li>
                <li><Link to="/products?type=laptop" style={{ color: 'var(--color-slate-300)' }}>لابتوبات للأعمال والدراسة</Link></li>
                <li><Link to="/products?type=accessory" style={{ color: 'var(--color-slate-300)' }}>ملحقات وشواحن</Link></li>
                <li><Link to="/orders" style={{ color: 'var(--color-slate-300)' }}>متابعة حالة الطلب</Link></li>
              </ul>
            </div>

            {/* Col 3: Contact & Location */}
            <div>
              <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                تواصل معنا وموقعنا
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                <div>📍 مول الواحة، الشهداء، أم درمان</div>
                <div>📞 هاتف المتجر: +249 9XX XXX XXX</div>
                <div>
                  <a
                    href="https://wa.me/249912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#25D366', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>💬</span> تواصل عبر واتساب
                  </a>
                </div>
                <div>⏰ مواعيد العمل: 10:00 ص - 10:00 م (الجمعة عطلة)</div>
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
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-400)',
            }}
          >
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} ويكس تكنولوجي (Wex Technology).
            </div>
            <div>
              تم التطوير بأحدث تقنيات الويب السريعة والآمنة PWA.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function varStyle(token) {
  return `var(--${token})`;
}
