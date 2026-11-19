import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Package,
  CreditCard,
  Laptop,
  FolderTree,
  Tag as TagIcon,
  TrendingUp,
  Truck,
  Settings,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Tag from '../components/common/Tag';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', label: 'لوحة التحكم', icon: BarChart3, end: true },
    { to: '/admin/orders', label: 'إدارة الطلبات', icon: Package, end: false },
    { to: '/admin/payments', label: 'مراجعة التحويلات', icon: CreditCard, end: false },
    { to: '/admin/products', label: 'إدارة المنتجات', icon: Laptop, end: false, adminOnly: true },
    { to: '/admin/categories', label: 'الفئات والتصنيفات', icon: FolderTree, end: true, adminOnly: true },
    { to: '/admin/brands', label: 'الماركات', icon: TagIcon, end: true, adminOnly: true },
    { to: '/admin/rates', label: 'سعر الصرف', icon: TrendingUp, end: true, adminOnly: true },
    { to: '/admin/shipping-zones', label: 'مناطق التوصيل', icon: Truck, end: true, adminOnly: true },
    { to: '/admin/settings', label: 'إعدادات المتجر', icon: Settings, end: true, adminOnly: true },
    { to: '/admin/users', label: 'المستخدمين والصلاحيات', icon: Users, end: false, adminOnly: true },
    { to: '/admin/audit-logs', label: 'سجل العمليات', icon: FileText, end: true, adminOnly: true },
  ];

  return (
    <div className={styles.layout}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div>
            <div className={styles.brandTitle}>
              Wex <span className={styles.brandAccent}>Admin</span>
            </div>
            <div className={styles.brandSubtitle}>لوحة الإدارة والعمليات</div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* User Card */}
        <div className={styles.userCard}>
          <div style={{ overflow: 'hidden' }}>
            <div className={styles.userName}>{user?.name || 'طاقم العمل'}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <Tag variant={isAdmin ? 'primary' : 'neutral'}>
            {isAdmin ? 'مدير' : 'موظف'}
          </Tag>
        </div>

        {/* Nav List */}
        <nav className={styles.navList} aria-label="أقسام الإدارة">
          {navLinks.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
                }
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.storeLink} target="_blank">
            <ExternalLink size={14} strokeWidth={1.75} />
            <span>عرض المتجر</span>
          </Link>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} strokeWidth={1.75} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className={styles.contentArea}>
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="فتح القائمة الجانبية"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <div className={styles.topBarTitle}>لوحة التحكم</div>
          <div>
            <Tag variant={isAdmin ? 'primary' : 'neutral'}>
              {isAdmin ? 'مدير نظام' : 'طاقم تشغيل'}
            </Tag>
          </div>
        </div>

        <div className={styles.pageBody}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
