import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Send, Power, RefreshCw, Megaphone } from 'lucide-react';
import { pushApi } from '../../api/push';
import { usePush } from '../../context/PushContext';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPushSection.module.css';

export default function AdminPushSection() {
  const push = usePush();
  const { success, error: toastError } = useToast();

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('/notifications');
  const [segment, setSegment] = useState('customers');
  const [broadcasting, setBroadcasting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logRes] = await Promise.all([
        pushApi.adminGetStats(),
        pushApi.adminGetLog({ page: 1, per_page: 10 }),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (Array.isArray(logRes?.data)) setLogs(logRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleGlobal = async () => {
    if (!stats) return;
    setToggling(true);
    try {
      const nextVal = !stats.push_enabled;
      const res = await pushApi.adminUpdateSettings({ push_enabled: nextVal });
      setStats((prev) => ({ ...prev, push_enabled: Boolean(res?.data?.push_enabled) }));
      success(nextVal ? 'تم تفعيل الإشعارات الفورية على مستوى المتجر' : 'تم إيقاف الإشعارات الفورية على مستوى المتجر');
    } catch (err) {
      toastError(err?.message || 'تعذر تحديث الإعداد');
    } finally {
      setToggling(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      await push?.sendTestPush();
      success('تم إرسال الإشعار التجريبي');
      loadData();
    } catch (err) {
      toastError(err?.message || 'تعذر إرسال الإشعار التجريبي');
    } finally {
      setSendingTest(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toastError('يرجى إدخال عنوان ونص الإشعار');
      return;
    }
    setBroadcasting(true);
    try {
      const res = await pushApi.adminBroadcast({
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || '/notifications',
        segment,
      });
      const targeted = res?.data?.targeted_users ?? 0;
      success(`تم إرسال الإشعار الجماعي إلى ${targeted} مستخدم`);
      setTitle('');
      setBody('');
      loadData();
    } catch (err) {
      toastError(err?.message || 'تعذر إرسال الإشعار الجماعي');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <section className={styles.wrapper} aria-label="إدارة الإشعارات الفورية">
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <Bell size={18} />
          <h2>نظام الإشعارات الفورية (Push)</h2>
        </div>
        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.killBtn} ${stats?.push_enabled ? styles.killBtnOn : styles.killBtnOff}`}
            onClick={handleToggleGlobal}
            disabled={toggling || loading}
          >
            <Power size={15} />
            <span>{stats?.push_enabled ? 'النظام مفعّل' : 'النظام متوقف'}</span>
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleSendTest}
            disabled={sendingTest}
          >
            <Send size={15} />
            <span>{sendingTest ? 'جاري الإرسال...' : 'إشعار تجريبي'}</span>
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={loadData}
            aria-label="تحديث إحصائيات الإشعارات"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>المشتركون النشطون</span>
            <strong className={styles.statValue}>{stats.active_subscribers}</strong>
            <span className={styles.statSub}>
              ويب: {stats.by_platform?.web || 0} • أندرويد: {stats.by_platform?.android || 0} • iOS: {stats.by_platform?.ios || 0}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>تم الإرسال (7 أيام)</span>
            <strong className={styles.statValue}>{stats.last_7_days?.sent || 0}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>فشل / منتهي (7 أيام)</span>
            <strong className={styles.statValue}>{stats.last_7_days?.failed || 0}</strong>
          </div>
        </div>
      )}

      <form className={styles.broadcastForm} onSubmit={handleBroadcast}>
        <div className={styles.formHeader}>
          <Megaphone size={16} />
          <h3>إرسال إشعار جماعي</h3>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>عنوان الإشعار</span>
            <input
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: وصول شحنة أجهزة جديدة"
            />
          </label>

          <label className={styles.field}>
            <span>الفئة المستهدفة</span>
            <select value={segment} onChange={(e) => setSegment(e.target.value)}>
              <option value="customers">جميع العملاء</option>
              <option value="with-open-orders">العملاء ذوو الطلبات المفتوحة</option>
              <option value="all">الجميع (العملاء والإدارة)</option>
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span>نص الإشعار</span>
          <textarea
            rows={2}
            maxLength={500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="نص قصير وواضح باللغة العربية الفصحى..."
          />
        </label>

        <label className={styles.field}>
          <span>الرابط الداخلي عند الضغط</span>
          <input
            type="text"
            dir="ltr"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/notifications"
          />
        </label>

        {(title || body) && (
          <div className={styles.previewBox}>
            <div className={styles.previewTag}>معاينة الإشعار</div>
            <div className={styles.previewTitle}>{title || 'عنوان الإشعار'}</div>
            <div className={styles.previewBody}>{body || 'نص الإشعار سيظهر هنا...'}</div>
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={broadcasting}>
          <Send size={15} />
          <span>{broadcasting ? 'جاري الإرسال...' : 'إرسال الآن'}</span>
        </button>
      </form>

      <div className={styles.logSection}>
        <h3 className={styles.logTitle}>سجل الإرسال الأخير</h3>
        {logs.length === 0 ? (
          <p className={styles.emptyLog}>لا توجد سجلات إرسال بعد.</p>
        ) : (
          <div className={styles.logList}>
            {logs.map((item) => (
              <div key={item.id} className={styles.logCard}>
                <div className={styles.logTop}>
                  <span className={styles.logType}>{item.title || item.type || 'إشعار'}</span>
                  <span className={`${styles.logStatus} ${styles[`status_${item.status}`] || ''}`}>
                    {item.status}
                  </span>
                </div>
                {item.error && <div className={styles.logError}>{item.error}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
