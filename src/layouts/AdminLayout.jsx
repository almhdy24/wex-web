import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || isAdmin;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', label: 'لوحة التحكم', icon: '📊', exact: true, staff: true },
    { to: '/admin/orders', label: 'إدارة الطلبات', icon: '📦', exact: true, staff: true },
    { to: '/admin/payments', label: 'مراجعة التحويلات', icon: '💳', exact: true, staff: true },
    { to: '/admin/products', label: 'إدارة المنتجات', icon: '💻', exact: false, adminOnly: true },
    { to: '/admin/categories', label: 'الفئات والتصنيفات', icon: '📂', exact: true, adminOnly: true },
    { to: '/admin/brands', label: 'الماركات التجارية', icon: '🏷️', exact: true, adminOnly: true },
    { to: '/admin/rates', label: 'سعر الصرف (درهم/جنيه)', icon: '📈', exact: true, adminOnly: true },
    { to: '/admin/shipping-zones', label: 'مناطق التوصيل والولايات', icon: '🚚', exact: true, adminOnly: true },
    { to: '/admin/settings', label: 'إعدادات المتجر', icon: '⚙️', exact: true, adminOnly: true },
    { to: '/admin/users', label: 'المستخدمين والصلاحيات', icon: '👥', exact: false, adminOnly: true },
    { to: '/admin/audit-logs', label: 'سجل العمليات الإدارية', icon: '📜', exact: true, adminOnly: true },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-slate-100)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(6, 26, 85, 0.5)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--color-navy)',
          color: 'var(--color-slate-200)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          zIndex: 999,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease-in-out',
          boxShadow: 'var(--shadow-lg)',
        }}
        className="admin-sidebar"
      >
        {/* Brand header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: 'var(--color-white)', fontSize: 'var(--text-lg)' }}>
              Wex <span style={{ color: 'var(--color-cyan)' }}>Admin</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>
              لوحة الإدارة والعمليات
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(false)}
            style={{ color: 'var(--color-white)', display: 'block' }}
            className="mobile-close-sidebar-btn"
          >
            ✕
          </button>
        </div>

        {/* Current user pill */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-royal-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-white)',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
            }}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--color-white)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.name || 'المستخدم'}
            </div>
            <Badge variant={isAdmin ? 'warning' : 'info'} style={{ fontSize: '10px' }}>
              {isAdmin ? 'مدير عام' : 'موظف متجر'}
            </Badge>
          </div>
        </div>

        {/* Navigation list */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-3) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          {navLinks.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--color-white)' : 'var(--color-slate-300)',
                  backgroundColor: isActive ? 'var(--color-royal-blue)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease',
                })}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <Link
            to="/"
            className="btn btn-outline btn-sm"
            style={{
              color: 'var(--color-slate-200)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'flex-start',
            }}
          >
            <span>🏪</span>
            <span>الواجهة العامة للمتجر</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-danger-outline btn-sm"
            style={{
              justifyContent: 'flex-start',
            }}
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginRight: 0,
          minHeight: '100vh',
        }}
        className="admin-main-container"
      >
        {/* Top Navbar */}
        <header
          style={{
            height: 'var(--header-height)',
            backgroundColor: 'var(--color-white)',
            borderBottom: '1px solid var(--color-slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة الجانبية"
              style={{ fontSize: '1.25rem', padding: '4px 8px' }}
            >
              ☰
            </button>
            <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-lg)' }}>
              لوحة التحكم الإدارية
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link to="/" className="btn btn-secondary btn-sm">
              زيارة المتجر
            </Link>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-slate-500)',
                display: 'none',
              }}
              className="admin-top-user"
            >
              {user?.email}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: 'var(--space-6)' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .admin-sidebar {
            transform: translateX(0) !important;
          }
          .admin-main-container {
            margin-right: var(--sidebar-width) !important;
          }
          .mobile-close-sidebar-btn {
            display: none !important;
          }
          .admin-top-user {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
