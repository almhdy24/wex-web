import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomTabBar.module.css';

export default function BottomTabBar({ activeOrderCount = 0 }) {
  const tabs = [
    {
      id: 'home',
      to: '/',
      label: 'الرئيسية',
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'catalog',
      to: '/products',
      label: 'المتجر',
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      id: 'orders',
      to: '/orders',
      label: 'طلباتي',
      badge: activeOrderCount > 0 ? activeOrderCount : null,
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: 'account',
      to: '/account',
      label: 'حسابي',
      icon: (
        <svg className={styles.navIcon} viewBox="0 0 24 24">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="شريط التنقل السفلي">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          {tab.icon}
          {tab.badge && <span className={styles.navBadge}>{tab.badge}</span>}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
