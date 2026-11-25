/**
 * Single Source of Truth for all Admin Routes, Navigation Groups, Bottom Tabs, and Titles.
 * Consumed by router.jsx, AdminShell.jsx, and e2e/tests/admin-crawler.spec.js.
 */

export const ADMIN_NAV_GROUPS = [
  { id: 'ops', label: 'العمليات' },
  { id: 'store', label: 'المتجر' },
  { id: 'content', label: 'المحتوى' },
  { id: 'system', label: 'النظام' },
];

export const ADMIN_ROUTES = [
  {
    path: '/admin',
    title: 'اليوم',
    group: 'ops',
    icon: 'LayoutDashboard',
    allowedRoles: ['staff', 'admin'],
    isTopLevel: true,
    showInNav: true,
    inBottomBar: true,
  },
  {
    path: '/admin/orders',
    title: 'الطلبات',
    group: 'ops',
    icon: 'Package',
    allowedRoles: ['staff', 'admin'],
    isTopLevel: true,
    showInNav: true,
    inBottomBar: true,
    badgeKey: 'pendingOrders',
  },
  {
    path: '/admin/payments',
    title: 'المدفوعات',
    group: 'ops',
    icon: 'CreditCard',
    allowedRoles: ['staff', 'admin'],
    isTopLevel: true,
    showInNav: true,
    inBottomBar: true,
    badgeKey: 'pendingPayments',
  },
  {
    path: '/admin/products',
    title: 'المنتجات',
    group: 'store',
    icon: 'Laptop',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
    inBottomBar: true,
    badgeKey: 'lowStock',
  },
  {
    path: '/admin/categories',
    title: 'الفئات',
    group: 'store',
    icon: 'FolderTree',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/brands',
    title: 'الماركات',
    group: 'store',
    icon: 'Tag',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/rates',
    title: 'الأسعار',
    group: 'store',
    icon: 'TrendingUp',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/shipping-zones',
    title: 'مناطق التوصيل',
    group: 'store',
    icon: 'Truck',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/payment-accounts',
    title: 'حسابات الدفع',
    group: 'store',
    icon: 'Landmark',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/recent-purchases',
    title: 'المشتريات الأخيرة',
    group: 'store',
    icon: 'Activity',
    allowedRoles: ['staff', 'admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/hero-slides',
    title: 'الشرائح',
    group: 'content',
    icon: 'Sliders',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/home-sections',
    title: 'أقسام الرئيسية',
    group: 'content',
    icon: 'LayoutGrid',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/announcements',
    title: 'الإعلانات',
    group: 'content',
    icon: 'Megaphone',
    allowedRoles: ['staff', 'admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/faq',
    title: 'الأسئلة',
    group: 'content',
    icon: 'HelpCircle',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/pages',
    title: 'الصفحات',
    group: 'content',
    icon: 'FileText',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/settings',
    title: 'الإعدادات',
    group: 'system',
    icon: 'Settings',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/users',
    title: 'المستخدمون',
    group: 'system',
    icon: 'Users',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  {
    path: '/admin/audit-logs',
    title: 'سجل العمليات',
    group: 'system',
    icon: 'ScrollText',
    allowedRoles: ['admin'],
    isTopLevel: true,
    showInNav: true,
  },
  // Detail / Form sub-routes
  {
    path: '/admin/products/new',
    title: 'إضافة جهاز جديد',
    group: 'store',
    allowedRoles: ['admin'],
    isTopLevel: false,
    showInNav: false,
    parentPath: '/admin/products',
  },
  {
    path: '/admin/products/:id/edit',
    title: 'تعديل الجهاز',
    group: 'store',
    allowedRoles: ['admin'],
    isTopLevel: false,
    showInNav: false,
    parentPath: '/admin/products',
  },
  {
    path: '/admin/orders/:orderNumber',
    title: 'تفاصيل الطلب',
    group: 'ops',
    allowedRoles: ['staff', 'admin'],
    isTopLevel: false,
    showInNav: false,
    parentPath: '/admin/orders',
  },
];

export const TOP_LEVEL_ADMIN_ROUTES = new Set(
  ADMIN_ROUTES.filter((r) => r.isTopLevel).map((r) => r.path)
);

export function isTopLevelAdminRoute(pathname) {
  return TOP_LEVEL_ADMIN_ROUTES.has(pathname);
}

export function getAdminRouteTitle(pathname) {
  const exact = ADMIN_ROUTES.find((r) => r.path === pathname);
  if (exact) return exact.title;
  if (pathname.startsWith('/admin/orders/')) return 'تفاصيل الطلب';
  if (pathname.startsWith('/admin/products/') && pathname.endsWith('/edit')) return 'تعديل الجهاز';
  return 'لوحة الإدارة';
}

export function getAdminNavGroups(role) {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: ADMIN_ROUTES.filter(
      (r) => r.showInNav && r.group === group.id && (!role || r.allowedRoles.includes(role))
    ),
  })).filter((g) => g.items.length > 0);
}
