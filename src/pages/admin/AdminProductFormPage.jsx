import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Check, ExternalLink, Copy } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatAed, formatSdg } from '../../utils/formatters';
import { getProductUrl } from '../../utils/productUrl';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Stepper from '../../components/admin/Stepper';
import ImageManager from '../../components/admin/ImageManager';
import { Skeleton } from '../../components/common/Skeleton';
import Page from '../../components/common/Page';
import FormSection from './productForm/FormSection';
import CategoryPicker from './productForm/CategoryPicker';
import SpecField from './productForm/SpecField';
import {
  CONDITION_OPTIONS,
  SECTIONS,
  TYPE_LABELS,
  validateProductForm,
  mapServerErrors,
  firstErrorField,
  sectionsWithErrors,
  sectionOfField,
  visibleFields,
  completeness,
  sectionSummary,
  buildProductName,
  typoWarning,
  duplicateWarning,
  formatThousands,
  digitsOnly,
  cleanSpecs,
  specLineFromSchema,
  hasArabic,
} from './productForm/formLogic';
import styles from './AdminProductFormPage.module.css';
import w from './productForm/ProductWizard.module.css';

// Re-exported for tests and other pages.
export { validateProductForm, mapServerErrors };

const TYPE_SLUG = { laptop: 'laptops', phone: 'phones', accessory: 'accessories' };
const SPEC_GROUP_LABELS = {
  basic: 'الموديل', cpu: 'المعالج', memory: 'الذاكرة والتخزين', screen: 'الشاشة', gpu: 'كرت الشاشة', extra: 'تفاصيل إضافية',
};
const EMPTY_FORM = {
  name: '', type: '', subcategory: '', category_id: '', brand_id: '', condition: 'used_imported',
  price_aed: '', stock_quantity: 1, warranty_text: '', short_description: '', description: '',
  is_active: true, is_featured: false, is_draft: false, specs: {},
};
const domId = (k) => `f-${String(k).replace('.', '-')}`;
const draftKey = (id) => `wex_admin_product_draft_${id || 'new'}`;

function scrollAndShake(field) {
  const el = document.getElementById(`field-${domId(field)}`) || document.getElementById(domId(field));
  if (!el) return;
  if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add(w.shake);
  window.setTimeout(() => el.classList.remove(w.shake), 600);
  const focusable = el.matches('input,select,textarea,button') ? el : el.querySelector('input,select,textarea,button');
  if (focusable && typeof focusable.focus === 'function') focusable.focus({ preventScroll: true });
}

/** Label + error wrapper for the base (non-schema) fields. */
function Field({ name, label, required, error, help, warn, children }) {
  return (
    <div id={`field-${domId(name)}`} className={`${w.field} ${error ? w.invalid : ''}`}>
      <span className={w.fieldLabel}>
        {label}
        {required ? <span className={w.req} aria-hidden="true">*</span> : null}
      </span>
      {children}
      {error ? <span className={w.fieldError} role="alert">{error}</span> : null}
      {!error && warn ? <span className={w.fieldWarn}>{warn}</span> : null}
      {!error && !warn && help ? <span className={w.fieldHelp}>{help}</span> : null}
    </div>
  );
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copyId = searchParams.get('copy');
  const presetType = searchParams.get('type');
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(isEditMode || Boolean(copyId));
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [schemas, setSchemas] = useState({});
  const [existingNames, setExistingNames] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [productSlug, setProductSlug] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [brandText, setBrandText] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [legacySpecs, setLegacySpecs] = useState(null);
  const [step0Done, setStep0Done] = useState(isEditMode || Boolean(copyId) || ['laptop', 'phone', 'accessory'].includes(presetType));
  const [openSection, setOpenSection] = useState('category');
  const [restorable, setRestorable] = useState(null);

  // Images
  const [images, setImages] = useState([]);
  const [queuedFiles, setQueuedFiles] = useState([]);

  // Linked accessories (edit mode)
  const [accessories, setAccessories] = useState([]);
  const [allAccessories, setAllAccessories] = useState([]);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('');
  const [linkingAccessory, setLinkingAccessory] = useState(false);

  const schema = schemas[form.type] || null;
  const patch = useCallback((changes) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, ...changes }));
  }, []);
  const clearErr = (...keys) =>
    setErrors((prev) => {
      if (!keys.some((k) => prev[k])) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  // ---- Metadata ----------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [catRes, brandRes, rateRes, schemaRes, prodRes] = await Promise.all([
        adminApi.getCategories().catch(() => ({ data: [] })),
        adminApi.getBrands().catch(() => ({ data: [] })),
        adminApi.getRates({ per_page: 1 }).catch(() => ({ data: [] })),
        adminApi.getSpecSchema().catch(() => ({ data: [] })),
        adminApi.getProducts({ per_page: 100 }).catch(() => ({ data: [] })),
      ]);
      if (!mounted) return;
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
      const rateItems = rateRes.data || [];
      if (rateItems.length > 0) setCurrentRate(rateItems[0].rate_sdg || rateItems[0].rate || null);
      const map = {};
      (schemaRes.data || []).forEach((s) => { map[s.type] = s; });
      setSchemas(map);
      setExistingNames((prodRes.data || []).map((p) => p.name));
    })();
    return () => { mounted = false; };
  }, []);

  // Category id follows the chosen type (laptops / phones / accessories) when it can be matched.
  useEffect(() => {
    if (!form.type || form.category_id || categories.length === 0) return;
    const match = categories.find((c) => c.slug === TYPE_SLUG[form.type]);
    if (match) setForm((prev) => (prev.category_id ? prev : { ...prev, category_id: String(match.id) }));
  }, [form.type, form.category_id, categories]);

  // New product with ?type=… preset.
  useEffect(() => {
    if (!isEditMode && !copyId && ['laptop', 'phone', 'accessory'].includes(presetType)) {
      setForm((prev) => (prev.type ? prev : { ...prev, type: presetType }));
    }
  }, [isEditMode, copyId, presetType]);

  // ---- Load product (edit / duplicate) ---------------------------------------------
  useEffect(() => {
    const sourceId = id || copyId;
    if (!sourceId) return undefined;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.getProduct(sourceId);
        const p = res.data;
        if (!p) throw new Error('المنتج غير موجود');
        if (!mounted) return;
        const dup = !id;
        setProductSlug(p.slug || '');
        setForm({
          name: dup ? `${p.name || ''} (نسخة)` : p.name || '',
          type: p.type || 'laptop',
          subcategory: p.subcategory || '',
          category_id: p.category_id ? String(p.category_id) : '',
          brand_id: p.brand_id ? String(p.brand_id) : '',
          condition: p.condition || 'used_imported',
          price_aed: p.price_aed ? String(p.price_aed) : '',
          stock_quantity: Number(p.stock_quantity ?? 1),
          warranty_text: p.warranty_text || '',
          short_description: p.short_description || '',
          description: p.description || '',
          is_active: dup ? true : Boolean(p.is_active),
          is_featured: dup ? false : Boolean(p.is_featured),
          is_draft: dup ? false : Boolean(p.is_draft),
          specs: p.spec_data && !Array.isArray(p.spec_data) ? { ...p.spec_data } : {},
        });
        setBrandText(p.brand_name || '');
        setNameTouched(true);
        setNeedsReview(Boolean(p.needs_review) && !dup);
        setLegacySpecs(p.specs_legacy || (p.needs_review ? p.specs : null));
        if (!dup) {
          setImages(p.images || []);
          setAccessories(p.accessories || []);
        }
        setIsDirty(dup);
      } catch (err) {
        toastError(hasArabic(err?.message) ? err.message : 'تعذر تحميل بيانات الجهاز');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, copyId, toastError]);

  useEffect(() => {
    if (!isEditMode) return undefined;
    let mounted = true;
    adminApi
      .getProducts({ type: 'accessory', per_page: 100 })
      .then((res) => mounted && setAllAccessories(res.data || []))
      .catch(() => {});
    return () => { mounted = false; };
  }, [isEditMode]);

  // ---- Local draft autosave / restore ----------------------------------------------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(id));
      if (raw && !copyId) setRestorable(JSON.parse(raw));
    } catch { /* storage unavailable */ }
  }, [id, copyId]);

  useEffect(() => {
    if (!isDirty || loading) return undefined;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey(id), JSON.stringify({ form, brandText, ts: Date.now() }));
      } catch { /* quota / private mode */ }
    }, 800);
    return () => window.clearTimeout(t);
  }, [form, brandText, isDirty, loading, id]);

  const clearLocalDraft = () => {
    try { window.localStorage.removeItem(draftKey(id)); } catch { /* ignore */ }
  };

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = adminAr.products.unsavedChangesWarning;
        return adminAr.products.unsavedChangesWarning;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // ---- Derived values ----------------------------------------------------------------
  const brandName = useMemo(() => {
    const b = brands.find((x) => String(x.id) === String(form.brand_id));
    return b ? b.name : '';
  }, [brands, form.brand_id]);

  const subtypes = schemas.accessory?.subtypes || [];
  const subtypeLabel = subtypes.find((s) => s.value === form.subcategory)?.label || '';
  const conditionLabel = CONDITION_OPTIONS.find((o) => o.value === form.condition)?.label || '';
  const specFields = useMemo(() => visibleFields(schema, form.specs, form.condition), [schema, form.specs, form.condition]);
  const comp = useMemo(() => completeness(form, schema, isEditMode ? images.length : queuedFiles.length), [form, schema, isEditMode, images, queuedFiles]);

  // Product name is auto-built from brand + model until the admin edits it by hand.
  useEffect(() => {
    if (nameTouched || isEditMode) return;
    const auto = buildProductName(brandName, form.specs?.model);
    setForm((prev) => (prev.name === auto ? prev : { ...prev, name: auto }));
  }, [brandName, form.specs?.model, nameTouched, isEditMode]);

  const modelSuggestions = useMemo(() => {
    const prefix = brandName.toLowerCase();
    const out = new Set();
    existingNames.forEach((n) => {
      const low = n.toLowerCase();
      if (prefix && low.startsWith(prefix)) out.add(n.slice(brandName.length).trim());
    });
    return [...out].filter(Boolean).slice(0, 30);
  }, [existingNames, brandName]);

  const nameWarn = useMemo(
    () => typoWarning(form.name) || duplicateWarning(form.name, existingNames, isEditMode ? form.name : ''),
    [form.name, existingNames, isEditMode],
  );

  const errorSections = useMemo(() => (attempted ? sectionsWithErrors(errors) : new Set()), [errors, attempted]);
  const liveSdg = currentRate && form.price_aed ? Number(form.price_aed) * currentRate : null;
  const stockNum = Number(form.stock_quantity) || 0;
  const statusKey = form.is_draft ? 'draft' : !form.is_active ? 'hidden' : stockNum <= 0 ? 'out' : 'published';
  const STATUS = { draft: ['مسودة', w.pillDraft], hidden: ['مخفي', w.pillHidden], out: ['نفد', w.pillOut], published: ['منشور', w.pillPublished] };

  // ---- Handlers ------------------------------------------------------------------------
  const handleField = (name, value) => {
    patch({ [name]: value });
    clearErr(name);
  };
  const handleSpec = (key, value) => {
    patch({ specs: { ...form.specs, [key]: value } });
    clearErr(`spec.${key}`);
  };
  const handleType = (type) => {
    const match = categories.find((c) => c.slug === TYPE_SLUG[type]);
    patch({ type, subcategory: '', specs: {}, category_id: match ? String(match.id) : '' });
    clearErr('type', 'category_id', 'subcategory');
  };
  const handleBrandText = (text) => {
    setBrandText(text);
    const hit = brands.find((b) => b.name.toLowerCase() === text.trim().toLowerCase());
    patch({ brand_id: hit ? String(hit.id) : '' });
    clearErr('brand_id');
  };

  const toggleSection = (sid) => setOpenSection((cur) => (cur === sid ? '' : sid));
  const goNext = (sid) => {
    const idx = SECTIONS.findIndex((s) => s.id === sid);
    const next = SECTIONS[idx + 1];
    if (next) {
      setOpenSection(next.id);
      window.setTimeout(() => document.getElementById(`sec-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };

  const buildPayload = ({ draft, publish }) => ({
    name: form.name.trim(),
    type: form.type,
    subcategory: form.type === 'accessory' ? form.subcategory || undefined : undefined,
    category_id: form.category_id ? Number(form.category_id) : undefined,
    brand_id: form.brand_id ? Number(form.brand_id) : undefined,
    condition: form.condition,
    price_aed: form.price_aed ? Number(form.price_aed) : undefined,
    stock_quantity: Number(form.stock_quantity),
    warranty_text: form.warranty_text.trim() || undefined,
    short_description: form.short_description.trim() || undefined,
    description: form.description.trim() || undefined,
    spec_data: cleanSpecs(form.specs, schema, form.condition),
    is_draft: draft ? 1 : 0,
    is_active: draft ? 0 : publish ? 1 : form.is_active ? 1 : 0,
    is_featured: form.is_featured ? 1 : 0,
  });

  const showErrors = (errs) => {
    setErrors(errs);
    setAttempted(true);
    toastError('تحقق من الحقول المظللة بالأحمر');
    const first = firstErrorField(errs);
    if (first) {
      setOpenSection(sectionOfField(first));
      window.setTimeout(() => scrollAndShake(first), 60);
    }
  };

  const save = async ({ draft = false, publish = false } = {}) => {
    const clientErrors = validateProductForm(form, schema, { draft });
    if (Object.keys(clientErrors).length > 0) {
      showErrors(clientErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const payload = buildPayload({ draft, publish });
    try {
      let savedId = id;
      if (isEditMode) {
        await adminApi.updateProduct(id, payload);
      } else {
        const createRes = await adminApi.createProduct(payload);
        savedId = createRes.data?.id;
        if (savedId && queuedFiles.length > 0) {
          try {
            const fd = new FormData();
            queuedFiles.forEach((item) => fd.append('images[]', item.file));
            await adminApi.uploadProductImages(savedId, fd);
          } catch {
            // Non-blocking: images can be managed from the edit screen.
          }
        }
      }
      setIsDirty(false);
      clearLocalDraft();
      success(draft ? 'تم حفظ المسودة' : isEditMode ? 'تم حفظ التعديلات بنجاح' : 'تم نشر المنتج بنجاح');
      setCelebrate(true);
      window.setTimeout(() => {
        setCelebrate(false);
        if (draft && savedId) navigate(`/admin/products/${savedId}/edit`);
        else navigate('/admin/products');
      }, 900);
    } catch (err) {
      const serverErrors = mapServerErrors(err && err.errors);
      if (Object.keys(serverErrors).length > 0) {
        showErrors(serverErrors);
      } else {
        // Never surface raw English server text.
        toastError(hasArabic(err && err.message) ? err.message : 'تعذّر حفظ الجهاز. حاول مرة أخرى.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const restoreDraft = () => {
    if (restorable?.form) {
      setForm({ ...EMPTY_FORM, ...restorable.form });
      setBrandText(restorable.brandText || '');
      setNameTouched(true);
      setStep0Done(Boolean(restorable.form.type));
      setIsDirty(true);
    }
    setRestorable(null);
  };
  const discardDraft = () => {
    clearLocalDraft();
    setRestorable(null);
  };

  const handleLinkAccessory = async (e) => {
    e.preventDefault();
    if (!selectedAccessoryId) return;
    try {
      setLinkingAccessory(true);
      await adminApi.linkAccessory(id, selectedAccessoryId);
      success('تم ربط الملحق بالجهاز');
      const prodRes = await adminApi.getProduct(id);
      setAccessories(prodRes.data?.accessories || []);
      setSelectedAccessoryId('');
    } catch (err) {
      toastError(hasArabic(err?.message) ? err.message : 'فشل ربط الملحق');
    } finally {
      setLinkingAccessory(false);
    }
  };

  const handleUnlinkAccessory = async (accessoryId) => {
    try {
      await adminApi.unlinkAccessory(id, accessoryId);
      success('تم إلغاء ربط الملحق');
      setAccessories((prev) => prev.filter((a) => a.id !== accessoryId));
    } catch (err) {
      toastError(hasArabic(err?.message) ? err.message : 'فشل إلغاء ربط الملحق');
    }
  };

  // ---- Render ----------------------------------------------------------------------------
  if (loading) {
    return (
      <Page className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="400px" borderRadius="var(--radius-lg)" />
      </Page>
    );
  }

  const header = (
    <header className={styles.header}>
      <Link to="/admin/products" className={styles.backLink}>
        <ArrowRight size={14} />
        <span>العودة لقائمة المنتجات</span>
      </Link>
      <h1 className={styles.title}>{isEditMode ? `تعديل: ${form.name || 'الجهاز'}` : adminAr.products.addNew}</h1>
      <p className={styles.subtitle}>
        {isEditMode ? 'تحديث المواصفات، المخزون، الصور، والملحقات' : 'أضف الجهاز خطوة بخطوة — الحقول مرتبطة بنوع المنتج'}
      </p>
    </header>
  );

  if (!step0Done) {
    return (
      <Page className={styles.container}>
        {header}
        {restorable ? (
          <div className={w.banner}>
            <span>لديك مسودة غير مكتملة محفوظة على هذا الجهاز.</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <Button type="button" size="sm" variant="primary" onClick={restoreDraft}>استعادة المسودة</Button>
              <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>تجاهل</Button>
            </span>
          </div>
        ) : null}
        <CategoryPicker
          type={form.type}
          subcategory={form.subcategory}
          subtypes={subtypes}
          onType={handleType}
          onSubtype={(v) => patch({ subcategory: v })}
          onContinue={() => { setStep0Done(true); setOpenSection('photos'); }}
        />
      </Page>
    );
  }

  const ctx = {
    subtypeLabel, brandName, conditionLabel,
    imageCount: isEditMode ? images.length : queuedFiles.length,
    specLine: specLineFromSchema(schema, form.specs),
    percent: comp.percent,
  };
  const secProps = (sid, idx) => ({
    id: sid,
    index: idx + 1,
    title: SECTIONS[idx].label,
    summary: sectionSummary(sid, form, ctx),
    open: openSection === sid,
    onToggle: toggleSection,
    invalid: errorSections.has(sid),
    done: !errorSections.has(sid) && (
      (sid === 'category' && Boolean(form.type && form.category_id)) ||
      (sid === 'photos' && ctx.imageCount > 0) ||
      (sid === 'basic' && form.name.trim().length >= 3) ||
      (sid === 'specs' && specFields.filter((f) => f.required).every((f) => form.specs[f.key] !== undefined && form.specs[f.key] !== '') && specFields.length > 0) ||
      (sid === 'pricing' && Number(form.price_aed) > 0)
    ),
  });

  const groups = [];
  specFields.forEach((f) => {
    const g = f.group || 'extra';
    let bucket = groups.find((x) => x.id === g);
    if (!bucket) { bucket = { id: g, fields: [] }; groups.push(bucket); }
    bucket.fields.push(f);
  });
  const fieldsWithData = specFields.map((f) => (f.key === 'model' ? { ...f, datalist: 'model-suggestions' } : f));
  const byKey = Object.fromEntries(fieldsWithData.map((f) => [f.key, f]));

  return (
    <Page className={styles.container}>
      {header}

      {restorable ? (
        <div className={w.banner}>
          <span>لديك مسودة غير مكتملة محفوظة على هذا الجهاز.</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <Button type="button" size="sm" variant="primary" onClick={restoreDraft}>استعادة المسودة</Button>
            <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>تجاهل</Button>
          </span>
        </div>
      ) : null}

      {needsReview ? (
        <div className={`${w.banner} ${w.bannerWarn}`} role="status">
          هذا المنتج قديم ولم تُحوَّل مواصفاته بالكامل — راجع الحقول في قسم المواصفات ثم احفظ.
        </div>
      ) : null}

      {/* Sticky progress */}
      <nav className={w.progress} aria-label="خطوات النموذج">
        {SECTIONS.map((s, i) => {
          const p = secProps(s.id, i);
          return (
            <button
              key={s.id}
              type="button"
              className={`${w.progressDot} ${openSection === s.id ? w.progressDotActive : ''} ${p.done ? w.progressDotDone : ''} ${p.invalid ? w.progressDotError : ''}`}
              onClick={() => setOpenSection(s.id)}
            >
              {p.done && openSection !== s.id ? <Check size={14} /> : <span>{i + 1}</span>}
              <span>{s.label}</span>
            </button>
          );
        })}
      </nav>

      <form
        className={w.sections}
        noValidate
        onSubmit={(e) => { e.preventDefault(); save({ publish: !isEditMode || form.is_draft }); }}
      >
        {/* 1. Category */}
        <FormSection {...secProps('category', 0)}>
          <div className={w.chips}>
            {['laptop', 'phone', 'accessory'].map((t) => (
              <button
                key={t}
                type="button"
                className={`${w.chip} ${form.type === t ? w.chipOn : ''}`}
                onClick={() => handleType(t)}
                disabled={isEditMode}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          {form.type === 'accessory' ? (
            <Field name="subcategory" label="نوع الملحق" required error={errors.subcategory}>
              <div className={w.chips}>
                {subtypes.map((s) => (
                  <button key={s.value} type="button" className={`${w.chip} ${form.subcategory === s.value ? w.chipOn : ''}`} onClick={() => handleField('subcategory', s.value)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
          <Field name="brand_id" label="الماركة" error={errors.brand_id} help="ابدأ بالكتابة واختر من القائمة">
            <input
              id={domId('brand_id')}
              className={w.control}
              list="brand-options"
              value={brandText}
              onChange={(e) => handleBrandText(e.target.value)}
              placeholder="مثال: HP"
              dir="auto"
            />
            <datalist id="brand-options">
              {brands.map((b) => <option key={b.id} value={b.name} />)}
            </datalist>
            {brandText && !form.brand_id ? <span className={w.fieldWarn}>اختر ماركة من القائمة</span> : null}
          </Field>
          <Field name="condition" label="الحالة" required error={errors.condition}>
            <div className={w.chips} role="radiogroup" aria-label="حالة الجهاز">
              {CONDITION_OPTIONS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={form.condition === o.value} className={`${w.chip} ${form.condition === o.value ? w.chipOn : ''}`} onClick={() => handleField('condition', o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
          {!categories.some((c) => c.slug === TYPE_SLUG[form.type]) ? (
            <Field name="category_id" label="القسم" required error={errors.category_id}>
              <Select
                name="category_id"
                value={form.category_id}
                onChange={(e) => handleField('category_id', e.target.value)}
                options={[{ value: '', label: 'اختر القسم...' }, ...categories.map((c) => ({ value: String(c.id), label: c.name_ar || c.name }))]}
              />
            </Field>
          ) : null}
          <div className={w.nextRow}><Button type="button" size="sm" variant="primary" onClick={() => goNext('category')}>التالي</Button></div>
        </FormSection>

        {/* 2. Photos */}
        <FormSection {...secProps('photos', 1)}>
          {schema?.hint_images ? <p className={w.fieldHelp}>{schema.hint_images}</p> : null}
          <ImageManager
            productId={isEditMode ? id : null}
            images={images}
            onImagesChange={setImages}
            queuedFiles={queuedFiles}
            onQueuedFilesChange={setQueuedFiles}
          />
          <div className={w.nextRow}><Button type="button" size="sm" variant="primary" onClick={() => goNext('photos')}>التالي</Button></div>
        </FormSection>

        {/* 3. Basic info */}
        <FormSection {...secProps('basic', 2)}>
          <Field name="name" label="اسم الجهاز" required error={errors.name} warn={nameWarn} help={!nameTouched && !isEditMode ? 'يُبنى تلقائياً من الماركة والموديل — يمكنك تعديله' : undefined}>
            <input
              id={domId('name')}
              className={w.control}
              value={form.name}
              onChange={(e) => { setNameTouched(true); handleField('name', e.target.value); }}
              placeholder="مثال: HP ProBook 440 G7"
              dir="auto"
            />
          </Field>
          <Field name="short_description" label="وصف مختصر يظهر في البطاقات">
            <input id={domId('short_description')} className={w.control} value={form.short_description} onChange={(e) => handleField('short_description', e.target.value)} placeholder="أهم ميزة في سطر واحد" maxLength={255} />
          </Field>
          <Field name="description" label="الوصف التفصيلي (اختياري)">
            <textarea id={domId('description')} className={styles.textarea} rows={4} value={form.description} onChange={(e) => handleField('description', e.target.value)} placeholder="حالة المنافذ، الشاشة، البطارية..." />
          </Field>
          <Field name="warranty_text" label="ملاحظات على الحالة أو الضمان (اختياري)">
            <input id={domId('warranty_text')} className={w.control} value={form.warranty_text} onChange={(e) => handleField('warranty_text', e.target.value)} maxLength={255} />
          </Field>
          <div className={w.nextRow}><Button type="button" size="sm" variant="primary" onClick={() => goNext('basic')}>التالي</Button></div>
        </FormSection>

        {/* 4. Specs (schema-driven) */}
        <FormSection {...secProps('specs', 3)}>
          {!schema ? <Skeleton height="120px" /> : null}
          {legacySpecs && typeof legacySpecs === 'object' ? (
            <details className={w.legacyBox}>
              <summary>المواصفات القديمة (للرجوع إليها)</summary>
              <ul className={w.legacyList}>
                {Object.entries(legacySpecs).map(([k, v]) => <li key={k}>{k}: {String(v)}</li>)}
              </ul>
            </details>
          ) : null}
          <datalist id="model-suggestions">
            {modelSuggestions.map((m) => <option key={m} value={m} />)}
          </datalist>
          {groups.map((g) => (
            <div key={g.id} className={w.specGroup}>
              {groups.length > 1 && SPEC_GROUP_LABELS[g.id] ? <span className={w.fieldLabel}>{SPEC_GROUP_LABELS[g.id]}</span> : null}
              {g.fields.map((f) => (
                <SpecField
                  key={f.key}
                  field={byKey[f.key]}
                  value={form.specs[f.key]}
                  onChange={handleSpec}
                  error={errors[`spec.${f.key}`]}
                  domId={domId(`spec.${f.key}`)}
                />
              ))}
            </div>
          ))}
          <div className={w.nextRow}><Button type="button" size="sm" variant="primary" onClick={() => goNext('specs')}>التالي</Button></div>
        </FormSection>

        {/* 5. Price & stock */}
        <FormSection {...secProps('pricing', 4)}>
          <div id="pricing" />
          <Field
            name="price_aed"
            required
            error={errors.price_aed}
            label={<span>السعر الأساسي بالدرهم <span className={styles.adminBadge}>للإدارة فقط</span></span>}
            help={liveSdg ? `= ${formatSdg(liveSdg)} بسعر صرف اليوم` : 'يُحسب السعر بـ ج.س تلقائياً من سعر الصرف'}
          >
            <input
              id={domId('price_aed')}
              className={w.control}
              inputMode="numeric"
              dir="ltr"
              value={formatThousands(form.price_aed)}
              onChange={(e) => handleField('price_aed', digitsOnly(e.target.value))}
              placeholder="1,200"
              autoComplete="off"
            />
          </Field>
          <Field name="stock_quantity" label="الكمية في المخزون" error={errors.stock_quantity}>
            <Stepper value={Number(form.stock_quantity) || 0} min={0} onChange={(v) => handleField('stock_quantity', v)} ariaLabel="تعديل مخزون الجهاز" />
            {stockNum === 0 ? <span className={`${w.stockHint} ${w.stockOut}`}>نفد من المخزون</span> : null}
            {stockNum > 0 && stockNum <= 2 ? <span className={`${w.stockHint} ${w.stockLow}`}>كمية محدودة</span> : null}
          </Field>
          <div className={w.nextRow}><Button type="button" size="sm" variant="primary" onClick={() => goNext('pricing')}>التالي</Button></div>
        </FormSection>

        {/* 6. Review & publish */}
        <FormSection {...secProps('review', 5)}>
          <div className={w.meter}>
            <div className={w.meterTop}>
              <span>اكتمال البيانات</span>
              <span>{comp.percent}%</span>
            </div>
            <div className={w.meterTrack} role="progressbar" aria-valuenow={comp.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className={`${w.meterFill} ${comp.percent === 100 ? w.meterFillFull : ''}`} style={{ width: `${comp.percent}%` }} />
            </div>
            {comp.missing.length > 0 ? (
              <div className={w.missingList}>
                {comp.missing.map((m) => (
                  <button key={m.label} type="button" className={w.missingChip} onClick={() => setOpenSection(m.section)}>
                    {m.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className={w.fieldHelp}>كل البيانات مكتملة، جاهز للنشر.</span>
            )}
          </div>
          <div>
            <span className={`${w.statusPill} ${STATUS[statusKey][1]}`}>{STATUS[statusKey][0]}</span>
            {isEditMode ? <span className={w.fieldHelp}> · رمز المنتج WEX-{String(id).padStart(5, '0')}</span> : null}
          </div>
          <label className={w.toggleRow}>
            <input type="checkbox" checked={form.is_featured} onChange={(e) => patch({ is_featured: e.target.checked })} />
            <span>معروض بالواجهة الرئيسية</span>
          </label>
          {isEditMode && !form.is_draft ? (
            <label className={w.toggleRow}>
              <input type="checkbox" checked={!form.is_active} onChange={(e) => patch({ is_active: !e.target.checked })} />
              <span>إخفاء من المتجر</span>
            </label>
          ) : null}

          {isEditMode && (form.type === 'laptop' || form.type === 'phone') ? (
            <div className={w.specGroup}>
              <span className={w.fieldLabel}>{adminAr.products.compatibleAccessories}</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Select
                  value={selectedAccessoryId}
                  onChange={(e) => setSelectedAccessoryId(e.target.value)}
                  options={[{ value: '', label: 'اختر ملحقاً لربطه...' }, ...allAccessories.map((acc) => ({ value: String(acc.id), label: `${acc.name} (${formatAed(acc.price_aed)})` }))]}
                />
                <Button type="button" variant="primary" size="md" disabled={!selectedAccessoryId || linkingAccessory} loading={linkingAccessory} onClick={handleLinkAccessory}>
                  {adminAr.products.linkAccessory}
                </Button>
              </div>
              {accessories.length === 0 ? (
                <span className={w.fieldHelp}>لم يتم ربط أي ملحقات بهذا الجهاز بعد.</span>
              ) : (
                accessories.map((acc) => (
                  <div key={acc.id} className={w.banner}>
                    <span>{acc.name} · {formatAed(acc.price_aed)}</span>
                    <Button type="button" variant="danger" size="sm" onClick={() => handleUnlinkAccessory(acc.id)}>{adminAr.products.unlinkAccessory}</Button>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </FormSection>

        {/* Sticky action bar */}
        <div className={styles.stickyBottomBar} role="region" aria-label="شريط حفظ التعديلات">
          <div className={styles.bottomBarInfo}>
            {isDirty ? <span className={styles.dirtyDot} title="توجد تعديلات غير محفوظة" /> : null}
            <span className={styles.bottomBarStatus}>{`اكتمال البيانات ${comp.percent}%`}</span>
          </div>
          <div className={styles.bottomBarActions}>
            {isEditMode ? (
              <>
                <Link to={`/admin/products/new?copy=${id}`} aria-label={adminAr.products.duplicate}>
                  <Button type="button" variant="ghost" size="md" tabIndex={-1}><Copy size={16} /></Button>
                </Link>
                <Link to={getProductUrl(productSlug || id)} target="_blank" rel="noopener noreferrer" aria-label={adminAr.products.previewInStore}>
                  <Button type="button" variant="ghost" size="md" tabIndex={-1}><ExternalLink size={16} /></Button>
                </Link>
              </>
            ) : null}
            <Button type="button" variant="outline" size="md" disabled={submitting} onClick={() => save({ draft: true })}>
              حفظ كمسودة
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting} className={styles.saveBtn}>
              <Check size={16} />
              <span>{isEditMode && !form.is_draft ? adminAr.products.saveProduct : 'نشر'}</span>
            </Button>
          </div>
        </div>
      </form>

      {celebrate ? (
        <div className={w.success} role="status" aria-live="polite">
          <div className={w.successCard}>
            <span className={w.successCheck}><Check size={34} /></span>
            <span>تم الحفظ</span>
          </div>
        </div>
      ) : null}
    </Page>
  );
}
