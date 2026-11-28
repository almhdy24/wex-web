import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Page from '../../components/common/Page';
import { Skeleton } from '../../components/common/Skeleton';
import PromoBanner from '../../components/promo/PromoBanner';
import { hasArabic } from './productForm/formLogic';
import {
  ACTIONS, EMPTY_PROMO, LAYOUTS, LIMITS, PLACEMENTS, PLATFORMS, THEMES,
  isoToLocalInput, payloadFrom, validatePromo,
} from './promotions/promoLogic';
import styles from './AdminPromotions.module.css';

function Field({ label, error, note, count, max, children }) {
  let extra = null;
  if (error) {
    extra = <span className={styles.error} role="alert">{error}</span>;
  } else if (note) {
    extra = <span className={styles.note}>{note}</span>;
  }
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {extra}
      {max ? <span className={styles.count}>{count}/{max}</span> : null}
    </div>
  );
}

function Picker({ value, options, onChange, label }) {
  return (
    <div className={styles.chips} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`${styles.pick} ${value === o.value ? styles.pickOn : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Scaled 1200px desktop frame that fits its container. */
function DesktopFrame({ children }) {
  const wrap = useRef(null);
  const [scale, setScale] = useState(0.33);
  useEffect(() => {
    if (!wrap.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / 1200)));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={wrap} className={styles.desktopWrap} style={{ blockSize: 360 * scale }}>
      <div className={styles.desktopInner} style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

export default function AdminPromotionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(EMPTY_PROMO);
  const [imageUrl, setImageUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let ok = true;
    adminApi.getPromotion(id).then((res) => {
      if (!ok) return;
      const p = res.data;
      setForm({
        ...EMPTY_PROMO, ...p,
        subtitle: p.subtitle || '', badge_text: p.badge_text || '', cta_label: p.cta_label || '', action_value: p.action_value || '',
        image_alt: p.image_alt || '', starts_at: isoToLocalInput(p.starts_at), ends_at: isoToLocalInput(p.ends_at),
      });
      setImageUrl(p.image_url || null);
    }).catch(() => toastError('تعذر تحميل العرض')).finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, [id, isEdit, toastError]);

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const previewPromo = useMemo(() => ({
    ...form,
    image_url: filePreview || imageUrl,
    ends_at: form.ends_at ? new Date(`${form.ends_at}:00+02:00`).toISOString() : null,
  }), [form, filePreview, imageUrl]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 614400) {
      setErrors((x) => ({ ...x, image: 'حجم الصورة يجب ألا يزيد عن 600 كيلوبايت' }));
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
    setErrors((x) => ({ ...x, image: undefined }));
  };

  const save = async () => {
    const hasImage = Boolean(file || imageUrl);
    const errs = validatePromo(form, { hasImage: hasImage || !isEdit });
    // New promos are created as text first when an image layout is chosen; the image is attached right after.
    if (Object.keys(errs).filter((k) => k !== 'image').length > 0 || (isEdit && errs.image)) {
      setErrors(errs);
      toastError('تحقق من الحقول المظللة بالأحمر');
      return;
    }
    setSaving(true);
    try {
      const payload = payloadFrom(form);
      let saved;
      const wantsImage = form.layout === 'image' || form.layout === 'split';
      if (isEdit) {
        saved = (await adminApi.updatePromotion(id, payload)).data;
      } else {
        saved = (await adminApi.createPromotion({ ...payload, layout: wantsImage ? 'text' : form.layout })).data;
      }
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        await adminApi.uploadPromotionImage(saved.id, fd);
        if (!isEdit && wantsImage) await adminApi.updatePromotion(saved.id, { layout: form.layout });
      }
      success('تم حفظ العرض');
      navigate('/admin/promotions');
    } catch (err) {
      const mapped = {};
      Object.entries(err?.errors || {}).forEach(([k, v]) => { mapped[k] = hasArabic(Array.isArray(v) ? v[0] : v) ? (Array.isArray(v) ? v[0] : v) : 'قيمة غير صحيحة'; });
      if (Object.keys(mapped).length) {
        setErrors(mapped);
        toastError('تحقق من الحقول المظللة بالأحمر');
      } else {
        toastError(hasArabic(err?.message) ? err.message : 'تعذر حفظ العرض');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Page className={styles.page}><Skeleton height="320px" /></Page>;

  const inv = (k) => (errors[k] ? styles.invalid : '');
  return (
    <Page className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isEdit ? 'تعديل العرض' : 'عرض جديد'}</h1>
          <p className={styles.sub}>المعاينة على اليسار تتحدث مباشرة. الصورة المقترحة 2:1 (1200×600 على الأقل) وبحجم أقل من 600 كيلوبايت.</p>
        </div>
        <Link to="/admin/promotions" className={styles.btn}>رجوع</Link>
      </header>

      <div className={styles.layout}>
        <div style={{ display: 'grid', gap: 16 }}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>المحتوى</h2>
            <Field label="العنوان" error={errors.title} count={form.title.length} max={LIMITS.title}>
              <input className={`${styles.input} ${inv('title')}`} value={form.title} maxLength={LIMITS.title + 20} onChange={(e) => set('title', e.target.value)} placeholder="مثال: لابتوب يناسب شغلك ودراستك" />
            </Field>
            <Field label="الوصف (اختياري)" error={errors.subtitle} count={form.subtitle.length} max={LIMITS.subtitle}>
              <input className={`${styles.input} ${inv('subtitle')}`} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
            </Field>
            <div className={styles.row2}>
              <Field label="الشارة (اختياري)" error={errors.badge_text} count={form.badge_text.length} max={LIMITS.badge_text}>
                <input className={`${styles.input} ${inv('badge_text')}`} value={form.badge_text} onChange={(e) => set('badge_text', e.target.value)} placeholder="مثال: عرض محدود" />
              </Field>
              <Field label="نص الزر" error={errors.cta_label} count={form.cta_label.length} max={LIMITS.cta_label}>
                <input className={`${styles.input} ${inv('cta_label')}`} value={form.cta_label} onChange={(e) => set('cta_label', e.target.value)} placeholder="مثال: تصفّح الآن" />
              </Field>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>الشكل</h2>
            <Field label="مكان الظهور" error={errors.placement}>
              <select className={`${styles.select} ${inv('placement')}`} value={form.placement} onChange={(e) => set('placement', e.target.value)}>
                {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="القالب"><Picker value={form.layout} options={LAYOUTS} onChange={(v) => set('layout', v)} label="قالب العرض" /></Field>
            <Field label="اللون"><Picker value={form.theme} options={THEMES} onChange={(v) => set('theme', v)} label="لون العرض" /></Field>
            {(form.layout === 'image' || form.layout === 'split') ? (
              <>
                <Field label="الصورة" error={errors.image} note={imageUrl || filePreview ? 'تم اختيار صورة. اختر ملفاً آخر لاستبدالها.' : 'jpg أو png أو webp، حتى 600 كيلوبايت'}>
                  <input className={`${styles.input} ${inv('image')}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
                </Field>
                <Field label="وصف الصورة (لقارئات الشاشة)">
                  <input className={styles.input} value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
                </Field>
              </>
            ) : null}
            <label className={styles.chips} style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={Boolean(form.show_countdown)} onChange={(e) => set('show_countdown', e.target.checked)} />
              <span>عرض عدّاد تنازلي حتى تاريخ الانتهاء</span>
            </label>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>الإجراء</h2>
            <Field label="عند الضغط"><Picker value={form.action_type} options={ACTIONS} onChange={(v) => set('action_type', v)} label="إجراء الضغط" /></Field>
            {form.action_type !== 'none' ? (
              <Field
                label={{ product: 'رقم المنتج أو رابطه المختصر', category: 'رابط الفئة المختصر (مثل laptops)', filter: 'كلمة البحث', url: 'الرابط (https)', whatsapp: 'نص رسالة واتساب' }[form.action_type]}
                error={errors.action_value}
              >
                <input className={`${styles.input} ${inv('action_value')}`} value={form.action_value} onChange={(e) => set('action_value', e.target.value)} dir={form.action_type === 'url' ? 'ltr' : 'auto'} />
              </Field>
            ) : null}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>الجدولة</h2>
            <div className={styles.row2}>
              <Field label="المنصة"><Picker value={form.platform} options={PLATFORMS} onChange={(v) => set('platform', v)} label="المنصة" /></Field>
              <Field label="الأولوية (الأعلى يظهر أولاً)">
                <input className={styles.input} type="number" inputMode="numeric" value={form.priority} onChange={(e) => set('priority', e.target.value)} dir="ltr" />
              </Field>
            </div>
            <div className={styles.row2}>
              <Field label="يبدأ في (توقيت الخرطوم)" error={errors.starts_at}>
                <input className={`${styles.input} ${inv('starts_at')}`} type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} dir="ltr" />
              </Field>
              <Field label="ينتهي في (توقيت الخرطوم)" error={errors.ends_at}>
                <input className={`${styles.input} ${inv('ends_at')}`} type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} dir="ltr" />
              </Field>
            </div>
            <label className={styles.chips} style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => set('is_active', e.target.checked)} />
              <span>العرض مفعّل</span>
            </label>
          </section>
        </div>

        <aside className={styles.preview} aria-label="معاينة العرض">
          <div className={styles.frame}>
            <span className={styles.frameLabel}>معاينة الجوال (343 بكسل)</span>
            <div className={styles.phone}>
              <PromoBanner promo={previewPromo} as="div" size="sm" variant={form.placement.endsWith('_strip') ? 'strip' : form.placement === 'cart_promo' ? 'compact' : 'banner'} />
            </div>
          </div>
          <div className={styles.frame}>
            <span className={styles.frameLabel}>معاينة سطح المكتب (1200 بكسل)</span>
            <DesktopFrame>
              <PromoBanner promo={previewPromo} as="div" size="lg" variant={form.placement.endsWith('_strip') ? 'strip' : 'banner'} />
            </DesktopFrame>
          </div>
        </aside>
      </div>

      <div className={styles.bar}>
        <Link to="/admin/promotions" className={styles.btn}>إلغاء</Link>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ العرض'}
        </button>
      </div>
    </Page>
  );
}
