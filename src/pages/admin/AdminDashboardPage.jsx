import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate, getOrderStatusInfo, getProductTypeLabel } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'فشل تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <Skeleton height="32px" width="300px" style={{ marginBottom: 'var(--space-6)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="110px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
        <Skeleton height="240px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'تعذر جلب مؤشرات لوحة التحكم'} onRetry={loadDashboard} />;
  }

  const {
    orders_by_status = {},
    pending_reviews_count = 0,
    today_orders = { count: 0, revenue_sdg: 0 },
    low_stock_products = [],
    exchange_rate = { rate_sdg: 650 },
    price_lock_hours = 4,
  } = data;

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 4 }}>لوحة العمليات والمؤشرات</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)', margin: 0 }}>
            متابعة حالة الطلبات اليومية، مراجعة إشعارات بنكك، ومخزون الأجهزة
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            🔄 تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Action Banner for Pending Reviews */}
      {pending_reviews_count > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            border: '1.5px solid var(--color-warning-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 800, color: '#92400E', fontSize: 'var(--text-sm)' }}>
                يوجد {pending_reviews_count} إشعار تحويل بنكي بانتظار المراجعة والاعتماد
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#B45309', marginTop: 2 }}>
                قم بمطابقة لقطة شاشة التحويل برقم الحساب لتأكيد الطلب قبل انتهاء مدة الحجز.
              </div>
            </div>
          </div>

          <Link to="/admin/payments">
            <Button variant="primary" size="sm">
              مراجعة الإشعارات الآن ←
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Today's Sales */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600, marginBottom: 4 }}>
            مبيعات اليوم المؤكدة
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-royal-blue)' }}>
            {formatSdg(today_orders.revenue_sdg)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginTop: 4 }}>
            عدد طلبات اليوم: {today_orders.count}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600, marginBottom: 4 }}>
            إشعارات الدفع المعلقة
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: pending_reviews_count > 0 ? 'var(--color-warning)' : 'var(--color-slate-700)' }}>
            {pending_reviews_count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginTop: 4 }}>
            تتطلب موافقة أو رفض مع سبب
          </div>
        </div>

        {/* Current Exchange Rate */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600, marginBottom: 4 }}>
            سعر الصرف المعتمد
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-navy)' }}>
            {exchange_rate.rate_sdg} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>جنيه/درهم</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginTop: 4 }}>
            مدة تثبيت السعر: {price_lock_hours} ساعات
          </div>
        </div>

        {/* Low Stock Alerts Count */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', fontWeight: 600, marginBottom: 4 }}>
            أجهزة أوشكت على النفاد
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: low_stock_products.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {low_stock_products.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginTop: 4 }}>
            كمية المخزون 2 أو أقل
          </div>
        </div>
      </div>

      {/* Orders Breakdown by Status */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>حالات طلبات المتجر</h3>
          <Link to="/admin/orders" style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
            عرض كل الطلبات ←
          </Link>
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {Object.entries(orders_by_status).map(([status, count]) => {
              const info = getOrderStatusInfo(status);
              return (
                <Link
                  key={status}
                  to={`/admin/orders?status=${status}`}
                  style={{
                    backgroundColor: 'var(--color-slate-50)',
                    border: '1px solid var(--color-slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', marginBottom: 2 }}>{info.icon}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', marginBottom: 4 }}>{info.label}</span>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-navy)' }}>{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low Stock Inventory Alerts Table */}
      {low_stock_products.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-danger)' }}>
              تنبيهات المخزون المنخفض
            </h3>
            <Link to="/admin/products" style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              إدارة المخزون ←
            </Link>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>معرف الجهاز</th>
                  <th>اسم الجهاز / المنتج</th>
                  <th>النوع</th>
                  <th>الكمية المتبقية</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono">#{item.id}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{item.name}</td>
                    <td>{getProductTypeLabel(item.type)}</td>
                    <td>
                      <Badge variant={item.stock_quantity === 0 ? 'danger' : 'warning'}>
                        {item.stock_quantity === 0 ? 'نفد (0)' : `${item.stock_quantity} فقط`}
                      </Badge>
                    </td>
                    <td>
                      <Link to={`/admin/products/${item.id}/edit`}>
                        <Button variant="outline" size="sm">
                          تعديل المخزون
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
