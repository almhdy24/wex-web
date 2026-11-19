import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Package, Coins, Clock, CreditCard } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatSdg, getOrderStatusInfo, getProductTypeLabel } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Tag from '../../components/common/Tag';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './AdminDashboardPage.module.css';

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
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="32px" width="300px" />
        <div style={{ height: 16 }} />
        <div className={styles.metricsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="110px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
        <div style={{ height: 16 }} />
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
    <div className={styles.container}>
      {/* Title */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>لوحة العمليات والمؤشرات</h1>
          <p className={styles.subtitle}>
            متابعة حالة الطلبات اليومية، مراجعة إشعارات بنكك، ومخزون الأجهزة
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw size={14} />
          <span>تحديث البيانات</span>
        </Button>
      </header>

      {/* Brand graphic: thin divider under admin page title */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Action Banner for Pending Reviews */}
      {pending_reviews_count > 0 && (
        <aside className={styles.alertBanner} aria-label="تنبيه إشعارات معلقة">
          <div className={styles.alertContent}>
            <AlertCircle size={24} className={styles.alertIcon} />
            <div>
              <div className={styles.alertTitle}>
                يوجد {pending_reviews_count} إشعار تحويل بنكي بانتظار المراجعة والاعتماد
              </div>
              <div className={styles.alertSub}>
                قم بمطابقة صورة التحويل برقم الحساب لتأكيد الطلب قبل انتهاء مدة الحجز.
              </div>
            </div>
          </div>

          <Link to="/admin/payments">
            <Button variant="primary" size="sm">
              <CreditCard size={14} />
              <span>مراجعة الإشعارات الآن</span>
            </Button>
          </Link>
        </aside>
      )}

      {/* Key Metrics Grid */}
      <section className={styles.metricsGrid} aria-label="المؤشرات الرئيسية">
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>طلبات اليوم</span>
            <Package size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{today_orders.count || 0}</div>
          <span className={styles.metricSub}>
            بإجمالي: {formatSdg(today_orders.revenue_sdg || 0)}
          </span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>إشعارات قيد المراجعة</span>
            <CreditCard size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{pending_reviews_count}</div>
          <span className={styles.metricSub}>تتطلب قرار اعتماد أو رفض</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>سعر الصرف المعتمد</span>
            <Coins size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>
            {exchange_rate.rate_sdg || 650} ج.س
          </div>
          <span className={styles.metricSub}>لكل 1 درهم إماراتي</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>مدة تثبيت السعر</span>
            <Clock size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{price_lock_hours} ساعات</div>
          <span className={styles.metricSub}>مهلة التحويل ورفع الإشعار</span>
        </div>
      </section>

      {/* Two Column Grid */}
      <div className={styles.sectionGrid}>
        {/* Orders by Status */}
        <section className={styles.card} aria-label="الطلبات حسب الحالة">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>حالات الطلبات الحالية</h2>
            <Link to="/admin/orders" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-royal-blue)' }}>
              عرض كل الطلبات ←
            </Link>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statusList}>
              {Object.entries(orders_by_status).map(([statusKey, count]) => {
                const info = getOrderStatusInfo(statusKey);
                return (
                  <div key={statusKey} className={styles.statusRow}>
                    <Tag variant={info.variant}>{info.label}</Tag>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Low Stock Products */}
        <section className={styles.card} aria-label="تنبيهات المخزون المنخفض">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>تنبيهات انخفاض المخزون</h2>
            <Link to="/admin/products" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-royal-blue)' }}>
              إدارة المخزون ←
            </Link>
          </div>
          <div className={styles.cardBody}>
            {low_stock_products.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                المخزون متوفر لكافة الأجهزة
              </p>
            ) : (
              <div className={styles.lowStockList}>
                {low_stock_products.map((prod) => (
                  <div key={prod.id} className={styles.lowStockItem}>
                    <div>
                      <Link to={`/admin/products/${prod.id}/edit`} className={styles.lowStockName}>
                        {prod.name}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>
                        {getProductTypeLabel(prod.type)}
                      </div>
                    </div>
                    <span className={styles.lowStockQty}>
                      متبقي: {prod.stock_quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
