import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, FileText } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatSdg, formatDate, getOrderStatusInfo } from '../../utils/formatters';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';
import styles from './AdminCommon.module.css';

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

      const nextParams = {};
      if (status) nextParams.status = status;
      if (deliveryType) nextParams.delivery_type = deliveryType;
      if (q.trim()) nextParams.q = q.trim();
      if (page > 1) nextParams.page = page;
      setSearchParams(nextParams, { replace: true });
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
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
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إدارة طلبات المتجر</h1>
          <p className={styles.subtitle}>
            {meta?.total !== undefined ? `إجمالي الطلبات: ${meta.total}` : 'متابعة كافة طلبات الشراء'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw size={14} />
          <span>تحديث</span>
        </Button>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <form onSubmit={handleSearchSubmit} className={styles.toolbarForm}>
          <Input
            label="بحث بالرقم أو الهاتف أو الاسم"
            placeholder="WEX-..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <Select
            label="تصفية حسب الحالة"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'كافة الحالات' },
              { value: 'pending_payment', label: 'بانتظار الدفع' },
              { value: 'payment_review', label: 'مراجعة إشعار الدفع' },
              { value: 'confirmed', label: 'مؤكد' },
              { value: 'ready_for_pickup', label: 'جاهز للاستلام' },
              { value: 'out_for_delivery', label: 'جاري التوصيل' },
              { value: 'completed', label: 'مكتمل ومستلم' },
              { value: 'cancelled', label: 'ملغي' },
              { value: 'expired', label: 'انتهت فترة الحجز' },
            ]}
          />

          <Select
            label="طريقة الاستلام"
            value={deliveryType}
            onChange={(e) => {
              setDeliveryType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'الكل' },
              { value: 'pickup', label: 'استلام من المحل' },
              { value: 'delivery', label: 'توصيل' },
            ]}
          />

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button type="submit" variant="primary" size="md">
              تطبيق
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={handleResetFilters}>
              مسح
            </Button>
          </div>
        </form>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات مطابقة"
          description="جرب البحث بكلمات مختلفة أو إزالة الفلاتر."
          actionLabel="مسح الفلاتر"
          onAction={handleResetFilters}
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const statusInfo = getOrderStatusInfo(o.status);
                  return (
                    <tr key={o.order_number}>
                      <td className={styles.orderNumber}>#{o.order_number}</td>
                      <td>{o.user_name || o.customer_name || 'عميل'}</td>
                      <td dir="ltr">{o.contact_phone}</td>
                      <td>{o.delivery_type === 'pickup' ? 'استلام' : 'توصيل'}</td>
                      <td>
                        <Tag variant={statusInfo.variant}>{statusInfo.label}</Tag>
                      </td>
                      <td className={styles.totalPrice}>{formatSdg(o.total_sdg)}</td>
                      <td className={styles.dateText}>{formatDate(o.created_at)}</td>
                      <td>
                        <Link to={`/admin/orders/${o.order_number}`}>
                          <Button variant="ghost" size="sm">
                            <FileText size={14} />
                            <span>عرض</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.total_pages > 1 && (
            <nav className={styles.pagination} aria-label="تنقل الصفحات">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
              <span className={styles.pageCount}>
                صفحة {meta.page} من {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
