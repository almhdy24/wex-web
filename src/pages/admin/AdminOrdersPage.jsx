import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [deliveryType, setDeliveryType] = useState(searchParams.get('delivery_type') || '');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 15 };
      if (status) params.status = status;
      if (deliveryType) params.delivery_type = deliveryType;
      if (q.trim()) params.q = q.trim();

      const res = await adminApi.getOrders(params);
      setOrders(res.data || []);
      setMeta(res.meta || null);

      // Sync URL
      const nextParams = {};
      if (status) nextParams.status = status;
      if (deliveryType) nextParams.delivery_type = deliveryType;
      if (q.trim()) nextParams.q = q.trim();
      if (page > 1) nextParams.page = page;
      setSearchParams(nextParams, { replace: true });
    } catch (err) {
      setError(err.message || 'فشل تحميل قائمة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, deliveryType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setStatus('');
    setDeliveryType('');
    setQ('');
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 4 }}>إدارة طلبات المتجر</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-xs)', margin: 0 }}>
            {meta?.total !== undefined ? `إجمالي الطلبات: ${meta.total}` : 'متابعة كافة طلبات الشراء'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrders}>
          🔄 تحديث
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <Input
            label="بحث برقم الطلب أو الهاتف أو العميل"
            placeholder="WEX-..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginBottom: 0 }}
          />

          <Select
            label="تصفية حسب الحالة"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'جميع الحالات' },
              { value: 'pending_payment', label: 'بانتظار الدفع' },
              { value: 'payment_review', label: 'مراجعة إشعار الدفع' },
              { value: 'confirmed', label: 'مؤكد' },
              { value: 'ready_for_pickup', label: 'جاهز للاستلام بالمحل' },
              { value: 'out_for_delivery', label: 'جاري التوصيل' },
              { value: 'completed', label: 'مكتمل' },
              { value: 'cancelled', label: 'ملغي' },
              { value: 'expired', label: 'منتهي الصلاحية' },
            ]}
            style={{ marginBottom: 0 }}
          />

          <Select
            label="نوع الاستلام"
            value={deliveryType}
            onChange={(e) => { setDeliveryType(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'الكل' },
              { value: 'pickup', label: 'استلام من المحل' },
              { value: 'delivery', label: 'توصيل' },
            ]}
            style={{ marginBottom: 0 }}
          />

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button type="submit" variant="primary" style={{ flex: 1 }}>
              بحث
            </Button>
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              إعادة ضبط
            </Button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أي طلبات"
          description="جرب تغيير معايير البحث أو اختيار حالة طلبات أخرى."
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table table-row-hover">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>طريقة الاستلام</th>
                  <th>المبلغ الإجمالي</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const statusInfo = getOrderStatusInfo(o.status);
                  return (
                    <tr key={o.order_number}>
                      <td className="en-text" style={{ fontWeight: 700, color: 'var(--color-navy)' }}>
                        #{o.order_number}
                      </td>
                      <td style={{ fontWeight: 600 }}>{o.user_name || o.customer_name || 'عميل المتجر'}</td>
                      <td className="en-text">{o.contact_phone}</td>
                      <td>{o.delivery_type === 'pickup' ? 'استلام بالمحل' : 'توصيل'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--color-royal-blue)' }}>
                        {formatSdg(o.total_sdg)}
                      </td>
                      <td>
                        <Badge variant={statusInfo.variant}>
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </Badge>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        {formatDate(o.created_at)}
                      </td>
                      <td>
                        <Link to={`/admin/orders/${o.order_number}`}>
                          <Button variant="secondary" size="sm">
                            إدارة الطلب
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', borderTop: '1px solid var(--color-slate-100)' }}>
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
