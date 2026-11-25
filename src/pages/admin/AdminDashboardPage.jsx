import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  Package,
  CreditCard,
  TrendingUp,
  Clock,
  Truck,
  Store,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Landmark,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { api } from '../../api/client';
import { adminAr } from '../../content/admin.ar';
import PushPermissionSheet from '../../components/common/PushPermissionSheet';
import { formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Page from '../../components/common/Page';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import StatusChip from '../../components/admin/StatusChip';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const { success, error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [hasActiveAccounts, setHasActiveAccounts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundMuted, setSoundMuted] = useState(() => {
    try {
      return localStorage.getItem('wex_admin_sound_muted') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSound = () => {
    setSoundMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wex_admin_sound_muted', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const formatCount = (val) => {
    const n = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(n);
  };

  // Quick Rate Modal
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [newRateInput, setNewRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const isRateUpdatedToday = (updatedAt) => {
    if (!updatedAt) return false;
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate()
    );
  };

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [dashRes, setRes, payRes] = await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getSettings(),
        api.get('/admin/payment-accounts'),
      ]);

      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value.data);
      } else {
        throw dashRes.reason;
      }

      if (setRes.status === 'fulfilled' && setRes.value?.data) {
        setSettingsData(setRes.value.data);
      }

      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value?.data)) {
        const activeCount = payRes.value.data.filter((a) => Boolean(a.is_active)).length;
        setHasActiveAccounts(activeCount > 0);
      } else if (dashRes.value?.data?.has_active_payment_accounts !== undefined) {
        setHasActiveAccounts(Boolean(dashRes.value.data.has_active_payment_accounts));
      }
    } catch (err) {
      if (!silent) {
        setError(err.message || 'الاتصال ضعيف. حاول مجدداً.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadDashboard(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickRateSubmit = async (e) => {
    e.preventDefault();
    const val = Number(newRateInput);
    if (!val || val <= 0) {
      toastError('يرجى إدخال سعر صرف صحيح');
      return;
    }

    setSavingRate(true);
    try {
      await adminApi.updateRate(val);
      success('تم تحديث سعر الصرف بنجاح');
      setRateModalOpen(false);
      setNewRateInput('');
      loadDashboard(true);
    } catch (err) {
      toastError(err.message || 'فشل تحديث سعر الصرف');
    } finally {
      setSavingRate(false);
    }
  };

  if (loading) {
    return (
      <Page className={styles.container}>
        <div className={styles.skeletonHeader}>
          <Skeleton height="32px" width="240px" />
          <Skeleton height="16px" width="360px" />
        </div>
        <div style={{ height: 20 }} />
        <Skeleton height="120px" borderRadius="var(--radius-lg)" />
        <div style={{ height: 20 }} />
        <div className={styles.metricsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      </Page>
    );
  }

  if (error || !data) {
    return (
      <Page className={styles.container}>
        <ErrorState message={error || adminAr.common.errorTitle} onRetry={() => loadDashboard()} />
      </Page>
    );
  }

  const {
    orders_by_status = {},
    pending_reviews_count = 0,
    today_orders = { count: 0, revenue_sdg: 0 },
    low_stock_products = [],
    exchange_rate = { rate_sdg: 650 },
    price_lock_hours = 4,
  } = data;

  // Urgent pending counts
  const toPrepareCount = orders_by_status.confirmed || 0;
  const readyPickupCount = orders_by_status.ready_for_pickup || 0;
  const outDeliveryCount = orders_by_status.out_for_delivery || 0;

  const isOrdersPaused =
    settingsData?.orders_enabled === false ||
    settingsData?.orders_enabled === '0' ||
    settingsData?.orders_enabled === 0 ||
    data?.orders_enabled === false;

  return (
    <Page className={styles.container}>
      {/* Title & Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>{adminAr.dashboard.title}</h1>
          <p className={styles.subtitle}>{adminAr.dashboard.subtitle}</p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSound}
            aria-label={soundMuted ? 'تفعيل صوت التنبيهات' : 'كتم صوت التنبيهات'}
            title={soundMuted ? 'تفعيل صوت التنبيهات' : 'كتم صوت التنبيهات'}
          >
            {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{soundMuted ? 'الصوت: صامت' : 'الصوت: مفعّل'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => loadDashboard()}>
            <RefreshCw size={14} />
            <span>{adminAr.common.refresh}</span>
          </Button>
        </div>
      </header>

      {/* Brand divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      <PushPermissionSheet variant="admin" />

      {/* Critical Alert: No Active Payment Account */}
      {!hasActiveAccounts && (
        <aside className={styles.dangerAlertBanner} role="alert" aria-label="تنبيه حسابات الدفع">
          <div className={styles.dangerAlertHeader}>
            <AlertOctagon size={24} className={styles.dangerAlertIcon} />
            <div className={styles.dangerAlertContent}>
              <h2 className={styles.dangerAlertTitle}>
                {adminAr.dashboard.noPaymentAccountsWarning}
              </h2>
              <p className={styles.dangerAlertSub}>
                {adminAr.paymentAccounts.emptyDesc}
              </p>
            </div>
          </div>
          <Link to="/admin/payment-accounts">
            <Button variant="danger" size="sm">
              <Landmark size={14} />
              <span>{adminAr.dashboard.configurePaymentAccountsNow}</span>
            </Button>
          </Link>
        </aside>
      )}

      {/* Orders Paused Banner */}
      {isOrdersPaused && (
        <aside className={styles.warningBanner} role="alert" aria-label="تنبيه إيقاف الطلبات">
          <div className={styles.warningContent}>
            <strong>{adminAr.dashboard.ordersPausedBanner}</strong>
            {settingsData?.orders_disabled_message && (
              <span className={styles.warningSub}>{settingsData.orders_disabled_message}</span>
            )}
          </div>
          <Link to="/admin/settings" className={styles.warningLink}>
            {adminAr.nav.settings} ←
          </Link>
        </aside>
      )}

      {/* Section: Requires Action (تحتاج إلى إجراء) */}
      <section className={styles.urgentSection} aria-label="تحتاج إلى إجراء">
        {/* Pending Payments Review Hero Card */}
        {pending_reviews_count > 0 ? (
          <aside className={styles.urgentCard} aria-label="إشعارات بانتظار المراجعة">
            <div className={styles.urgentHeader}>
              <div className={styles.urgentIconBox}>
                <AlertCircle size={24} className={styles.urgentIcon} />
              </div>
              <div className={styles.urgentInfo}>
                <h2 className={styles.urgentTitle}>
                  {formatCount(pending_reviews_count)} {adminAr.dashboard.pendingReviewsAlert}
                </h2>
                <p className={styles.urgentSub}>
                  قم بمطابقة إشعار التحويل البنكي وتأكيد الطلب قبل انتهاء مهلة تثبيت السعر.
                </p>
              </div>
            </div>

            <Link to="/admin/payments" className={styles.urgentActionBtn}>
              <Button variant="primary" size="md">
                <CreditCard size={16} />
                <span>{adminAr.dashboard.reviewNowCTA}</span>
              </Button>
            </Link>
          </aside>
        ) : (
          <div className={styles.allCaughtUpCard}>
            <CheckCircle2 size={20} className={styles.allCaughtUpIcon} />
            <span>تمت مراجعة كافة إشعارات التحويل البنكي — لا توجد إشعارات معلقة.</span>
          </div>
        )}

        {/* Operational Flow Badges (To Prepare, Ready for Pickup, Out for Delivery) */}
        <div className={styles.flowBadgesGrid}>
          <Link to="/admin/orders?status=confirmed" className={styles.flowBadgeCard}>
            <div className={styles.flowBadgeIconBox}>
              <Package size={18} />
            </div>
            <div className={styles.flowBadgeContent}>
              <span className={styles.flowBadgeLabel}>بانتظار التجهيز</span>
              <span className={styles.flowBadgeValue}>{formatCount(toPrepareCount)}</span>
            </div>
            <ChevronLeft size={16} className={styles.flowBadgeArrow} />
          </Link>

          <Link to="/admin/orders?status=ready_for_pickup" className={styles.flowBadgeCard}>
            <div className={styles.flowBadgeIconBox}>
              <Store size={18} />
            </div>
            <div className={styles.flowBadgeContent}>
              <span className={styles.flowBadgeLabel}>جاهز للاستلام بالمحل</span>
              <span className={styles.flowBadgeValue}>{formatCount(readyPickupCount)}</span>
            </div>
            <ChevronLeft size={16} className={styles.flowBadgeArrow} />
          </Link>

          <Link to="/admin/orders?status=out_for_delivery" className={styles.flowBadgeCard}>
            <div className={styles.flowBadgeIconBox}>
              <Truck size={18} />
            </div>
            <div className={styles.flowBadgeContent}>
              <span className={styles.flowBadgeLabel}>مع مندوب التوصيل</span>
              <span className={styles.flowBadgeValue}>{formatCount(outDeliveryCount)}</span>
            </div>
            <ChevronLeft size={16} className={styles.flowBadgeArrow} />
          </Link>
        </div>
      </section>

      {/* Low Stock Warning Banner if items are low */}
      {low_stock_products.length > 0 && (
        <aside className={styles.lowStockBanner} aria-label="تنبيه انخفاض المخزون">
          <AlertTriangle size={18} className={styles.lowStockBannerIcon} />
          <div className={styles.lowStockBannerContent}>
            <strong>{formatCount(low_stock_products.length)} أجهزة قارب مخزونها على النفاد.</strong>
            <span> يرجى مراجعة المخزون وتحديث الكميات المتوفرة.</span>
          </div>
          <Link to="/admin/products" className={styles.lowStockBannerLink}>
            عرض الأجهزة ←
          </Link>
        </aside>
      )}

      {/* Key Metrics Row */}
      <section className={styles.metricsGrid} aria-label="المؤشرات التشغيلية">
        {/* Today Orders */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>{adminAr.dashboard.todayOrders}</span>
            <Package size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{formatCount(today_orders.count || 0)}</div>
          <span className={styles.metricSub}>
            {formatSdg(today_orders.revenue_sdg || 0)}
          </span>
        </div>

        {/* Pending Reviews */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>{adminAr.dashboard.pendingPaymentsCount}</span>
            <CreditCard size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{formatCount(pending_reviews_count)}</div>
          <span className={styles.metricSub}>
            {pending_reviews_count > 0 ? 'تتطلب قرار فوري' : 'تم التدقيق بالكامل'}
          </span>
        </div>

        {/* Active Exchange Rate with 1-tap update */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>{adminAr.dashboard.activeRate}</span>
            <TrendingUp size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>
            {formatCount(exchange_rate.rate_sdg || 650)} ج.س
          </div>
          <div className={styles.rateCardFooter}>
            <span className={styles.adminOnlyTag}>{adminAr.brand.forAdminOnly}</span>
            {isRateUpdatedToday(exchange_rate.updated_at) ? (
              <span className={styles.rateUpdatedChip} title={exchange_rate.updated_at}>
                {adminAr.dashboard.rateUpdatedToday}
              </span>
            ) : (
              <span className={styles.rateOutdatedChip} title="سعر الصرف لم يُحدّث اليوم">
                <AlertTriangle size={12} />
                {adminAr.dashboard.rateNotUpdatedToday}
              </span>
            )}
            <button
              type="button"
              className={styles.quickRateBtn}
              onClick={() => {
                setNewRateInput(String(exchange_rate.rate_sdg || ''));
                setRateModalOpen(true);
              }}
            >
              {adminAr.dashboard.quickUpdateRate}
            </button>
          </div>
        </div>

        {/* Price Lock Duration */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>{adminAr.dashboard.priceLockDuration}</span>
            <Clock size={18} className={styles.metricIcon} />
          </div>
          <div className={styles.metricValue}>{formatCount(price_lock_hours)} ساعات</div>
          <span className={styles.metricSub}>مهلة التحويل المتاحة للعميل</span>
        </div>
      </section>

      {/* Two Column Grid: Orders Distribution & Low Stock Inventory */}
      <div className={styles.sectionGrid}>
        {/* Orders Status Distribution */}
        <section className={styles.card} aria-label={adminAr.dashboard.ordersByStatusTitle}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{adminAr.dashboard.ordersByStatusTitle}</h2>
            <Link to="/admin/orders" className={styles.cardHeaderLink}>
              {adminAr.dashboard.viewAllOrders} ←
            </Link>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statusList}>
              {Object.entries(orders_by_status).map(([statusKey, count]) => (
                <Link
                  key={statusKey}
                  to={`/admin/orders?status=${statusKey}`}
                  className={styles.statusRow}
                >
                  <StatusChip status={statusKey} />
                  <span className={styles.statusCount}>{formatCount(count)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Low Stock Inventory */}
        <section className={styles.card} aria-label={adminAr.dashboard.lowStockTitle}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{adminAr.dashboard.lowStockTitle}</h2>
            <Link to="/admin/products" className={styles.cardHeaderLink}>
              {adminAr.dashboard.viewAllProducts} ←
            </Link>
          </div>
          <div className={styles.cardBody}>
            {low_stock_products.length === 0 ? (
              <p className={styles.emptyNotice}>
                {adminAr.dashboard.lowStockAllGood}
              </p>
            ) : (
              <div className={styles.lowStockList}>
                {low_stock_products.map((prod) => (
                  <div key={prod.id} className={styles.lowStockItem}>
                    <div className={styles.lowStockDetails}>
                      <Link to={`/admin/products/${prod.id}/edit`} className={styles.lowStockName}>
                        {prod.name}
                      </Link>
                      <span className={styles.lowStockType}>{prod.type}</span>
                    </div>
                    <span className={styles.lowStockQtyBadge}>
                      المتبقي: {formatCount(prod.stock_quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Rate Update Modal */}
      <Modal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title={adminAr.dashboard.quickUpdateRate}
      >
        <form onSubmit={handleQuickRateSubmit} className={styles.quickRateForm}>
          <Input
            label={adminAr.rates.newRateLabel}
            type="number"
            step="1"
            min="100"
            value={newRateInput}
            onChange={(e) => setNewRateInput(e.target.value)}
            required
            autoFocus
          />
          <p className={styles.quickRateNote}>
            {adminAr.rates.confirmRateDesc}
          </p>
          <div className={styles.quickRateActions}>
            <Button variant="primary" size="md" type="submit" loading={savingRate}>
              {adminAr.common.save}
            </Button>
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setRateModalOpen(false)}
              disabled={savingRate}
            >
              {adminAr.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
}
