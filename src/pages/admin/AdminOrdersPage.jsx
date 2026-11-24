import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Truck, Store, ExternalLink, CheckSquare, Square, Download } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatSdg, formatRelativeTime, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import DataList from '../../components/admin/DataList';
import FilterBar from '../../components/admin/FilterBar';
import StatusChip from '../../components/admin/StatusChip';
import Page from '../../components/common/Page';
import styles from './AdminOrdersPage.module.css';

const STATUS_FILTERS = [
  { key: '', label: 'الكل' },
  { key: 'pending_payment', label: 'بانتظار التحويل' },
  { key: 'payment_review', label: 'مراجعة الإشعار' },
  { key: 'confirmed', label: 'تم التأكيد' },
  { key: 'processing', label: 'قيد التجهيز' },
  { key: 'ready_for_pickup', label: 'جاهز للاستلام' },
  { key: 'out_for_delivery', label: 'مع المندوب' },
  { key: 'delivered', label: 'تم التسليم' },
  { key: 'cancelled', label: 'ملغي' },
  { key: 'expired', label: 'منتهي' },
];

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState([]);

  // Filter States synced with URL
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [deliveryType, setDeliveryType] = useState(searchParams.get('delivery_type') || '');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Status Counts from Dashboard for the filter chips
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    adminApi.getDashboard().then((res) => {
      if (res.data?.orders_by_status) {
        setStatusCounts(res.data.orders_by_status);
      }
    }).catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 15 };
      if (status) params.status = status;
      if (deliveryType) params.delivery_type = deliveryType;
      if (search.trim()) params.q = search.trim();

      const res = await adminApi.getOrders(params);
      setOrders(res.data || []);
      setMeta(res.meta || null);

      // Update URL query parameters
      const nextParams = {};
      if (status) nextParams.status = status;
      if (deliveryType) nextParams.delivery_type = deliveryType;
      if (search.trim()) nextParams.q = search.trim();
      if (page > 1) nextParams.page = String(page);
      setSearchParams(nextParams, { replace: true });
    } catch (err) {
      setError(err.message || 'تعذر الاتصال بالخادم. يرجى إعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  }, [page, status, deliveryType, search, setSearchParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusFilterChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStatus('');
    setDeliveryType('');
    setSearch('');
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const activeFiltersCount = (status ? 1 : 0) + (deliveryType ? 1 : 0) + (search ? 1 : 0);

  const allSelected = orders.length > 0 && selectedOrderNumbers.length === orders.length;

  const handleBulkExport = () => {
    if (selectedOrderNumbers.length === 0) return;
    const selectedOrders = orders.filter((o) => selectedOrderNumbers.includes(o.order_number));
    const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'الإجمالي', 'طريقة الاستلام', 'الحالة', 'التاريخ'];
    const rows = selectedOrders.map((o) => [
      o.order_number,
      o.customer_name || 'عميل',
      o.customer_phone || '-',
      o.total || o.final_amount || 0,
      o.delivery_type === 'pickup' ? 'استلام من المحل' : 'توصيل',
      o.status || '',
      o.created_at || '',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wex-orders-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Columns definition for DataList
  const columns = [
    {
      key: 'select',
      label: (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (allSelected) {
              setSelectedOrderNumbers([]);
            } else {
              setSelectedOrderNumbers(orders.map((o) => o.order_number));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              if (allSelected) {
                setSelectedOrderNumbers([]);
              } else {
                setSelectedOrderNumbers(orders.map((o) => o.order_number));
              }
            }
          }}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          aria-label={allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </span>
      ),
      render: (row) => {
        const isSelected = selectedOrderNumbers.includes(row.order_number);
        return (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrderNumbers((prev) =>
                isSelected ? prev.filter((id) => id !== row.order_number) : [...prev, row.order_number]
              );
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedOrderNumbers((prev) =>
                  isSelected ? prev.filter((id) => id !== row.order_number) : [...prev, row.order_number]
                );
              }
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            aria-label={isSelected ? `إلغاء تحديد الطلب ${row.order_number}` : `تحديد الطلب ${row.order_number}`}
          >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </span>
        );
      },
    },
    {
      key: 'order_number',
      label: adminAr.orders.orderNumber,
      isPrimary: true,
      render: (row) => (
        <div className={styles.orderNumberCol}>
          <span className={styles.orderNumberText}>#{row.order_number}</span>
          <span className={styles.orderDateSub} title={formatDate(row.created_at)}>
            {formatRelativeTime(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      label: adminAr.orders.customer,
      render: (row) => (
        <div className={styles.customerCol}>
          <span className={styles.customerName}>{row.customer_name || row.customer_phone || row.delivery_phone || row.order_number}</span>
          <span className={styles.customerPhone}>{row.customer_phone}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: adminAr.orders.status,
      isStatus: true,
      render: (row) => <StatusChip status={row.status} size="sm" />,
    },
    {
      key: 'total_sdg',
      label: adminAr.orders.totalSdg,
      align: 'end',
      render: (row) => (
        <span className={styles.totalAmount}>
          {formatSdg(row.total_sdg)}
        </span>
      ),
    },
    {
      key: 'delivery_type',
      label: 'الاستلام',
      render: (row) => (
        <div className={styles.deliveryTypeCol}>
          {row.delivery_type === 'delivery' ? (
            <span className={styles.deliveryBadge}>
              <Truck size={13} />
              <span>توصيل</span>
            </span>
          ) : (
            <span className={styles.pickupBadge}>
              <Store size={13} />
              <span>استلام</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'end',
      hideOnMobile: true,
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/orders/${row.order_number}`);
          }}
        >
          <span>التفاصيل</span>
          <ExternalLink size={13} />
        </Button>
      ),
    },
  ];

  return (
    <Page className={styles.container}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>{adminAr.orders.title}</h1>
          <p className={styles.subtitle}>
            {meta?.total !== undefined ? `إجمالي الطلبات المسجلة: ${meta.total}` : adminAr.orders.subtitle}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw size={14} />
          <span>{adminAr.common.refresh}</span>
        </Button>
      </header>

      {/* Brand Divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Horizontally Scrollable Status Filter Chips Bar */}
      <div className={styles.statusChipsScroll} role="tablist" aria-label="تصفية بحالة الطلب">
        {STATUS_FILTERS.map((item) => {
          const isActive = status === item.key;
          const count = item.key ? statusCounts[item.key] : meta?.total;
          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.statusFilterChip} ${isActive ? styles.activeFilterChip : ''}`}
              onClick={() => handleStatusFilterChange(item.key)}
              role="tab"
              aria-selected={isActive}
            >
              <span>{item.label}</span>
              {count !== undefined && count > 0 && (
                <span className={styles.filterChipCount}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={adminAr.orders.searchPlaceholder}
        filterCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      >
        <div className={styles.filterSelects}>
          <Select
            label="طريقة الاستلام"
            value={deliveryType}
            onChange={(e) => {
              setDeliveryType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: adminAr.orders.deliveryTypeAll },
              { value: 'pickup', label: adminAr.orders.pickup },
              { value: 'delivery', label: adminAr.orders.delivery },
            ]}
          />
        </div>
      </FilterBar>

      {/* Bulk Actions Toolbar (Visible when 1 or more orders selected) */}
      {selectedOrderNumbers.length > 0 && (
        <div className={styles.bulkBar} role="region" aria-label="الإجراءات الجماعية للطلبات">
          <div className={styles.bulkInfo}>
            <span>تم تحديد {selectedOrderNumbers.length} طلب</span>
          </div>
          <div className={styles.bulkActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
            >
              <Download size={14} />
              <span>تصدير المحدد (CSV)</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrderNumbers([])}
            >
              إلغاء التحديد
            </Button>
          </div>
        </div>
      )}

      {/* DataList Table / Cards View */}
      <DataList
        columns={columns}
        data={orders}
        keyField="order_number"
        loading={loading}
        emptyMessage={error || adminAr.common.noResults}
        onRowClick={(row) => navigate(`/admin/orders/${row.order_number}`)}
        pagination={
          meta
            ? {
                page: meta.page,
                totalPages: meta.total_pages,
                totalItems: meta.total,
                onPageChange: (newPage) => setPage(newPage),
              }
            : null
        }
      />
    </Page>
  );
}
