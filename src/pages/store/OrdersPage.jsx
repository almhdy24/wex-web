import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await ordersApi.getOrders(params);
      setOrders(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message || 'فشل تحميل قائمة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>طلباتي</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            متابعة حالة الطلبات، إشعارات الدفع، وتأكيدات الاستلام
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {[
            { key: '', label: 'الكل' },
            { key: 'pending_payment', label: 'بانتظار الدفع' },
            { key: 'confirmed', label: 'المؤكدة' },
            { key: 'completed', label: 'المكتملة' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 'var(--space-5)' }}>
              <Skeleton width="40%" height="22px" style={{ marginBottom: 'var(--space-2)' }} />
              <Skeleton width="60%" height="16px" style={{ marginBottom: 'var(--space-4)' }} />
              <Skeleton width="25%" height="24px" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات مسجلة"
          description={statusFilter ? 'لا توجد طلبات تطابق هذه الحالة المحددة.' : 'لم تقم بإنشاء أي طلبات حتى الآن. استكشف كتالوج الأجهزة وابدأ التسوق.'}
          actionLabel="تصفح الأجهزة"
          onAction={() => navigate('/products')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {orders.map((order) => {
            const statusInfo = getOrderStatusInfo(order.status);
            return (
              <div key={order.order_number} className="card card-hover" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>رقم الطلب</span>
                    <div className="en-text" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-navy)' }}>
                      #{order.order_number}
                    </div>
                  </div>
                  <Badge variant={statusInfo.variant}>
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-600)', marginBottom: 'var(--space-4)' }}>
                  <div>📅 تاريخ الطلب: {formatDate(order.created_at)}</div>
                  <div>🚚 الاستلام: {order.delivery_type === 'pickup' ? 'استلام من المحل' : 'توصيل'}</div>
                  {order.status === 'pending_payment' && order.seconds_remaining > 0 && (
                    <div style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      ⏳ متبقي للحجز: {Math.ceil(order.seconds_remaining / 60)} دقيقة
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-slate-100)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>الإجمالي المثبت: </span>
                    <span style={{ fontWeight: 800, color: 'var(--color-royal-blue)', fontSize: 'var(--text-base)' }}>
                      {formatSdg(order.total_sdg)}
                    </span>
                  </div>

                  <Link to={`/orders/${order.order_number}`}>
                    <Button variant="secondary" size="sm">
                      تفاصيل الطلب ومتابعة الحالة ←
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                السابق
              </Button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)' }}>
                صفحة {meta.page} من {meta.total_pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= meta.total_pages} onClick={() => setPage((p) => p + 1)}>
                التالي
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
