import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  CheckCircle2,
  Laptop,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import styles from './AdminRecentPurchasesPage.module.css';

export default function AdminRecentPurchasesPage() {
  const { success, error: toastError } = useToast();
  const [tickerEnabled, setTickerEnabled] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [setRes, ordersRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/recent-purchases'),
      ]);

      const isEnabled = setRes?.data?.ticker_enabled === '1' || setRes?.data?.ticker_enabled === 1 || setRes?.data?.ticker_enabled === true;
      setTickerEnabled(isEnabled);
      setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل بيانات النشاط الأخير');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleTicker = async () => {
    const nextState = !tickerEnabled;
    setSavingSettings(true);
    try {
      await api.patch('/admin/recent-purchases/settings', { enabled: nextState });
      setTickerEnabled(nextState);
      success(nextState ? 'تم تفعيل شريط المشتريات الأخيرة في المتجر' : 'تم تعطيل شريط المشتريات الأخيرة');
    } catch (err) {
      toastError(err.message || 'فشل حفظ الإعداد');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleHideOrder = async (order) => {
    try {
      const res = await api.patch(`/admin/recent-purchases/${order.order_id}/toggle-hide`);
      const newHidden = res?.data?.ticker_hidden;
      setOrders((prev) =>
        prev.map((o) => (o.order_id === order.order_id ? { ...o, ticker_hidden: newHidden } : o))
      );
      success(newHidden ? 'تم إخفاء هذا الطلب من شريط المشتريات' : 'تم إظهار هذا الطلب في شريط المشتريات');
    } catch (err) {
      toastError(err.message || 'فشل تغيير حالة الظهور للطلب');
    }
  };

  return (
    <Page className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>النشاط الأخير ومشتريات العملاء</h1>
          <p className={styles.subtitle}>
            التحكم في شريط المشتريات الأخيرة المكتملة وإخفاء عناصر محددة (بيانات حقيقية ومشفرة فقط)
          </p>
        </div>
      </div>

      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Master Toggle Card */}
      <section className={styles.toggleCard} aria-label="التحكم في شريط المشتريات">
        <div className={styles.toggleInfo}>
          <Activity size={24} className={styles.toggleIcon} />
          <div>
            <h3 className={styles.toggleTitle}>تفعيل شريط المشتريات الأخيرة في واجهة المتجر</h3>
            <p className={styles.toggleDesc}>
              يعرض إشعاراً منبثقاً دورياً بآخر الأجهزة التي تم شراؤها واكتمال دفعها خلال الـ 30 يوماً الماضية، بدون أي أسماء أو أرقام هواتف لحماية خصوصية العملاء.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleTicker}
          disabled={savingSettings}
          className={`${styles.masterToggleBtn} ${tickerEnabled ? styles.btnActive : styles.btnInactive}`}
        >
          {tickerEnabled ? 'مفعّل حالياً' : 'معطّل حالياً'}
        </button>
      </section>

      {/* Preview Section */}
      <section className={styles.previewSection} aria-label="معاينة الإشعار">
        <h3 className={styles.sectionHeading}>معاينة شكل الإشعار كما يظهر للمشتري</h3>
        <div className={styles.previewBox}>
          <div className={styles.toastMock}>
            <div className={styles.toastIconBox}>
              <Laptop size={18} />
            </div>
            <div className={styles.toastTextBox}>
              <span className={styles.toastSubText}>عملية شراء مكتملة</span>
              <strong className={styles.toastTitleText}>تم شراء Dell Latitude 7490 قبل ساعتين</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Orders List Section */}
      <section className={styles.ordersSection} aria-label="الطلبات المؤهلة للظهور">
        <div className={styles.ordersHeader}>
          <h2 className={styles.sectionHeading}>
            الطلبات المكتملة خلال آخر 30 يوماً ({orders.length})
          </h2>
          <span className={styles.privacyNotice}>
            بيانات مجهولة الهوية للعملاء تلقائياً
          </span>
        </div>

        {loading ? (
          <div className={styles.loadingList}>
            <Skeleton height="64px" borderRadius="var(--radius-md)" />
            <Skeleton height="64px" borderRadius="var(--radius-md)" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : orders.length === 0 ? (
          <div className={styles.emptyCard}>
            <CheckCircle2 size={36} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>لا توجد طلبات مكتملة خلال الـ 30 يوماً الماضية</h3>
            <p className={styles.emptyDesc}>
              بمجرد اكتمال تسليم واعتماد أي طلبات جديدة ستظهر تلقائياً في هذه القائمة مع إمكانية التحكم بظهورها.
            </p>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((ord) => (
              <div
                key={ord.order_id}
                className={`${styles.orderRow} ${ord.ticker_hidden ? styles.hiddenRow : ''}`}
              >
                <div className={styles.orderLeft}>
                  <strong className={styles.orderNumber}>#{ord.order_number}</strong>
                  <span className={styles.productName}>{ord.product_name}</span>
                </div>

                <div className={styles.orderRight}>
                  <span className={styles.orderDate}>
                    {ord.completed_at ? new Date(ord.completed_at).toLocaleDateString('ar-SD') : ''}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleHideOrder(ord)}
                    className={`${styles.visibilityBtn} ${
                      ord.ticker_hidden ? styles.visHidden : styles.visVisible
                    }`}
                  >
                    {ord.ticker_hidden ? (
                      <>
                        <EyeOff size={14} />
                        <span>مخفي من الشريط</span>
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        <span>ظاهر بالشريط</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
