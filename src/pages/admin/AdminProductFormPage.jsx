import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Layers,
  DollarSign,
  Image as ImageIcon,
  Cpu,
  Paperclip,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatAed, formatSdg } from '../../utils/formatters';
import { getProductUrl } from '../../utils/productUrl';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Stepper from '../../components/admin/Stepper';
import ImageManager from '../../components/admin/ImageManager';
import { Skeleton } from '../../components/common/Skeleton';
import Page from '../../components/common/Page';
import styles from './AdminProductFormPage.module.css';


// ---- Validation (client + server) -------------------------------------------
// The API accepts exactly these (wex-api Wex::CONDITIONS / PRODUCT_TYPES).
const CONDITION_OPTIONS = [
  { value: 'new', label: 'جديد' },
  { value: 'used_imported', label: 'مستعمل مستورد' },
];
const TYPE_VALUES = ['laptop', 'phone', 'accessory'];

// DOM order, used to scroll to the first invalid field.
const FIELD_ORDER = ['name', 'type', 'category_id', 'brand_id', 'condition', 'price_aed', 'stock_quantity'];

// Arabic fallbacks. Raw (English) server text is never shown to the user.
const FIELD_FALLBACK_AR = {
  name: 'اسم الجهاز غير صالح',
  type: 'اختر نوع المنتج',
  category_id: 'اختر القسم',
  brand_id: 'الماركة المحددة غير موجودة',
  condition: 'اختر حالة الجهاز',
  price_aed: 'أدخل السعر بالدرهم كرقم صحيح أكبر من صفر',
  stock_quantity: 'الكمية يجب أن تكون رقماً صحيحاً بين 0 و 100000',
};
const GENERIC_FIELD_AR = 'قيمة غير صحيحة';
const hasArabic = (t) => /[\u0600-\u06FF]/.test(String(t || ''));

export function validateProductForm(f) {
  const e = {};
  const name = String(f.name || '').trim();
  if (!name) e.name = 'اسم الجهاز مطلوب';
  else if (name.length < 3) e.name = 'اسم الجهاز قصير جداً';
  else if (name.length > 191) e.name = 'اسم الجهاز طويل جداً';
  if (!TYPE_VALUES.includes(f.type)) e.type = FIELD_FALLBACK_AR.type;
  if (!f.category_id) e.category_id = FIELD_FALLBACK_AR.category_id;
  if (!CONDITION_OPTIONS.some((o) => o.value === f.condition)) e.condition = FIELD_FALLBACK_AR.condition;
  const price = Number(f.price_aed);
  if (f.price_aed === '' || f.price_aed === null || !Number.isFinite(price) || price <= 0) {
    e.price_aed = 'أدخل السعر بالدرهم';
  } else if (!Number.isInteger(price)) {
    e.price_aed = 'السعر يجب أن يكون رقماً صحيحاً بدون كسور';
  } else if (price > 10000000) {
    e.price_aed = 'السعر كبير جداً';
  }
  const stock = Number(f.stock_quantity);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) e.stock_quantity = FIELD_FALLBACK_AR.stock_quantity;
  return e;
}

/** Maps an ApiError.errors object to { field: arabicMessage }. */
export function mapServerErrors(errors) {
  const out = {};
  if (!errors || typeof errors !== 'object') return out;
  Object.entries(errors).forEach(([field, msg]) => {
    const text = Array.isArray(msg) ? msg[0] : msg;
    out[field] = hasArabic(text) ? String(text) : FIELD_FALLBACK_AR[field] || GENERIC_FIELD_AR;
  });
  return out;
}

const NAME_TYPOS = { bropook: 'ProBook', bropok: 'ProBook', probok: 'ProBook', elitebok: 'EliteBook', thinkpd: 'ThinkPad' };
function nameTypoHint(name) {
  const m = String(name || '').toLowerCase().match(/[a-z]+/g) || [];
  for (const w of m) if (NAME_TYPOS[w]) return `تنبيه: هل تقصد «${NAME_TYPOS[w]}» بدل «${w}»؟`;
  return null;
}

function scrollToFirstError(errors) {
  const first = FIELD_ORDER.find((k) => errors[k]) || Object.keys(errors)[0];
  if (!first) return;
  const el = document.getElementById(first) || document.getElementById('pricing');
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.focus === 'function') el.focus({ preventScroll: true });
  }
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [productSlug, setProductSlug] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'laptop',
    category_id: '',
    brand_id: '',
    condition: 'used_imported',
    price_aed: '',
    stock_quantity: 1,
    warranty_text: '',
    short_description: '',
    description: '',
    is_active: true,
    is_featured: false,
  });

  // Specs Editor (Array of { key, value })
  const [specsList, setSpecsList] = useState([
    { key: 'المعالج', value: '' },
    { key: 'الرام', value: '' },
    { key: 'التخزين', value: '' },
    { key: 'كرت الشاشة', value: '' },
    { key: 'الشاشة', value: '' },
    { key: 'البطارية', value: '' },
  ]);

  // Images state
  const [images, setImages] = useState([]);
  const [queuedFiles, setQueuedFiles] = useState([]);

  // Accessories for Edit Mode
  const [accessories, setAccessories] = useState([]);
  const [allAccessories, setAllAccessories] = useState([]);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('');
  const [linkingAccessory, setLinkingAccessory] = useState(false);

  // Load Metadata (Categories, Brands, Current Rate)
  useEffect(() => {
    let mounted = true;
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes, rateRes] = await Promise.all([
          adminApi.getCategories().catch(() => ({ data: [] })),
          adminApi.getBrands().catch(() => ({ data: [] })),
          adminApi.getRates({ per_page: 1 }).catch(() => ({ data: [] })),
        ]);
        if (mounted) {
          setCategories(catRes.data || []);
          setBrands(brandRes.data || []);
          const rateItems = rateRes.data || [];
          if (rateItems.length > 0) {
            setCurrentRate(rateItems[0].rate_sdg || rateItems[0].rate || null);
          }
        }
      } catch {
        // non-blocking
      }
    };
    fetchMetadata();
    return () => {
      mounted = false;
    };
  }, []);

  // Load Product Data if Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    let mounted = true;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getProduct(id);
        const p = res.data;
        if (!p) throw new Error('المنتج غير موجود');

        if (mounted) {
          setProductSlug(p.slug || '');
          setFormData({
            name: p.name || '',
            type: p.type || 'laptop',
            category_id: p.category_id || '',
            brand_id: p.brand_id || '',
            condition: p.condition || 'used_imported',
            price_aed: p.price_aed || '',
            stock_quantity: Number(p.stock_quantity ?? 1),
            warranty_text: p.warranty_text || '',
            short_description: p.short_description || '',
            description: p.description || '',
            is_active: Number(p.is_active) === 1,
            is_featured: Number(p.is_featured) === 1,
          });

          // Parse Specs
          if (p.specs) {
            try {
              const parsed = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs;
              if (parsed && typeof parsed === 'object') {
                const loaded = Object.entries(parsed).map(([k, v]) => ({
                  key: k,
                  value: String(v),
                }));
                if (loaded.length > 0) setSpecsList(loaded);
              }
            } catch {
              // ignore
            }
          }

          setImages(p.images || []);
          setAccessories(p.accessories || []);
          setIsDirty(false);
        }
      } catch (err) {
        toastError(err.message || 'تعذر تحميل بيانات الجهاز');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [id, isEditMode, toastError]);

  // Load accessories for linking in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    let mounted = true;
    const fetchAcc = async () => {
      try {
        const res = await adminApi.getProducts({ type: 'accessory', per_page: 100 });
        if (mounted) setAllAccessories(res.data || []);
      } catch {
        // non-blocking
      }
    };
    fetchAcc();
    return () => {
      mounted = false;
    };
  }, [isEditMode]);

  // Unsaved changes beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = adminAr.products.unsavedChangesWarning;
        return adminAr.products.unsavedChangesWarning;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIsDirty(true);
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStockStepperChange = (val) => {
    setIsDirty(true);
    setFieldErrors((prev) => (prev.stock_quantity ? { ...prev, stock_quantity: undefined } : prev));
    setFormData((prev) => ({ ...prev, stock_quantity: val }));
  };

  // Specs editor
  const handleSpecChange = (index, field, value) => {
    setIsDirty(true);
    setSpecsList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSpecRow = () => {
    setIsDirty(true);
    setSpecsList((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index) => {
    setIsDirty(true);
    setSpecsList((prev) => prev.filter((_, i) => i !== index));
  };

  const applySpecsPreset = (presetType) => {
    setIsDirty(true);
    if (presetType === 'laptop') {
      setSpecsList([
        { key: 'المعالج', value: '' },
        { key: 'الرام', value: '' },
        { key: 'التخزين', value: '' },
        { key: 'كرت الشاشة', value: '' },
        { key: 'الشاشة', value: '' },
        { key: 'البطارية', value: '' },
      ]);
    } else if (presetType === 'phone') {
      setSpecsList([
        { key: 'الذاكرة', value: '' },
        { key: 'الرام', value: '' },
        { key: 'البطارية', value: '' },
        { key: 'الكاميرا', value: '' },
        { key: 'اللون', value: '' },
      ]);
    } else if (presetType === 'accessory') {
      setSpecsList([
        { key: 'النوع', value: '' },
        { key: 'التوافق', value: '' },
      ]);
    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const clientErrors = validateProductForm(formData);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toastError('تحقق من الحقول المظللة بالأحمر');
      scrollToFirstError(clientErrors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const specsObj = {};
    specsList.forEach((s) => {
      if (s.key.trim()) {
        specsObj[s.key.trim()] = s.value.trim();
      }
    });

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      category_id: formData.category_id ? Number(formData.category_id) : undefined,
      brand_id: formData.brand_id ? Number(formData.brand_id) : undefined,
      condition: formData.condition,
      price_aed: Number(formData.price_aed),
      stock_quantity: Number(formData.stock_quantity),
      warranty_text: formData.warranty_text.trim() || undefined,
      short_description: formData.short_description.trim() || undefined,
      description: formData.description.trim() || undefined,
      specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
      is_active: formData.is_active ? 1 : 0,
      is_featured: formData.is_featured ? 1 : 0,
    };

    try {
      if (isEditMode) {
        await adminApi.updateProduct(id, payload);
        setIsDirty(false);
        success('تم حفظ التعديلات بنجاح');
      } else {
        const createRes = await adminApi.createProduct(payload);
        setIsDirty(false);
        const newId = createRes.data?.id;

        if (newId && queuedFiles.length > 0) {
          try {
            const fd = new FormData();
            queuedFiles.forEach((item) => {
              fd.append('images[]', item.file);
            });
            await adminApi.uploadProductImages(newId, fd);
          } catch {
            // Non-blocking upload error; user can manage in edit mode
          }
        }

        success('تم إضافة الجهاز بنجاح.');
        if (newId) {
          navigate(`/admin/products/${newId}/edit`);
          return;
        }
        navigate('/admin/products');
      }
    } catch (err) {
      const serverErrors = mapServerErrors(err && err.errors);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        toastError('تحقق من الحقول المظللة بالأحمر');
        scrollToFirstError(serverErrors);
      } else {
        // Never surface raw English server text.
        toastError(hasArabic(err && err.message) ? err.message : 'تعذّر حفظ الجهاز. حاول مرة أخرى.');
      }
    } finally {
      setSubmitting(false);
    }
  };


  // Accessory Linking
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
      toastError(err.message || 'فشل ربط الملحق');
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
      toastError(err.message || 'فشل إلغاء ربط الملحق');
    }
  };

  // Floating section navigation links
  const sections = [
    { id: 'basic', label: adminAr.products.sectionBasic, icon: Layers },
    { id: 'pricing', label: adminAr.products.sectionPriceStock, icon: DollarSign },
    { id: 'photos', label: adminAr.products.sectionPhotos, icon: ImageIcon },
    { id: 'specs', label: adminAr.products.sectionSpecs, icon: Cpu },
    ...(isEditMode && (formData.type === 'laptop' || formData.type === 'phone')
      ? [{ id: 'accessories', label: adminAr.products.sectionAccessories, icon: Paperclip }]
      : []),
  ];

  const scrollToSection = (secId) => {
    setActiveSection(secId);
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <Page className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="400px" borderRadius="var(--radius-lg)" />
      </Page>
    );
  }

  const liveSdgPrice =
    currentRate && formData.price_aed
      ? (Number(formData.price_aed) || 0) * currentRate
      : null;

  return (
    <Page className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/admin/products" className={styles.backLink}>
          <ArrowRight size={14} />
          <span>العودة لقائمة المنتجات</span>
        </Link>
        <h1 className={styles.title}>
          {isEditMode ? `تعديل: ${formData.name || 'الجهاز'}` : adminAr.products.addNew}
        </h1>
        <p className={styles.subtitle}>
          {isEditMode ? 'تحديث المواصفات، المخزون، الصور، والملحقات' : 'أدخل بيانات الجهاز والمواصفات الفنية'}
        </p>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Mobile Sticky Section Pills (< 1024px) */}
      <nav className={styles.mobilePills} aria-label="أقسام النموذج">
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            className={`${styles.pillBtn} ${activeSection === sec.id ? styles.pillBtnActive : ''}`}
            onClick={() => scrollToSection(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </nav>

      {/* Main Layout Grid */}
      <div className={styles.formLayout}>
        {/* Floating Sidebar (Desktop >= 1024px) */}
        <aside className={styles.navSidebar} aria-label="فهرس أقسام النموذج">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                className={`${styles.navLink} ${activeSection === sec.id ? styles.navLinkActive : ''}`}
                onClick={() => scrollToSection(sec.id)}
              >
                <Icon size={16} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formContent} noValidate>
          {/* Section 1: Basic Info */}
          <section id="basic" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{adminAr.products.sectionBasic}</h2>
            </div>
            <div className={styles.sectionBody}>
              <Input
                label="اسم الجهاز كاملاً"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثال: Dell Latitude 5420 i7 11th Gen 16GB 512GB SSD"
                required
                error={fieldErrors.name}
                helperText={!fieldErrors.name ? nameTypoHint(formData.name) || undefined : undefined}
              />

              <div className={styles.grid3}>
                <Select
                  label="نوع المنتج"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  options={[
                    { value: 'laptop', label: 'لابتوب' },
                    { value: 'phone', label: 'هاتف' },
                    { value: 'accessory', label: 'ملحق' },
                  ]}
                  required
                  error={fieldErrors.type}
                />

                <Select
                  label="القسم"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  options={[
                    { value: '', label: 'اختر القسم...' },
                    ...categories.map((c) => ({
                      value: String(c.id),
                      label: c.name_ar || c.name,
                    })),
                  ]}
                  required
                  error={fieldErrors.category_id}
                />

                <Select
                  label="الماركة"
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  options={[
                    { value: '', label: 'بدون ماركة محددة' },
                    ...brands.map((b) => ({ value: String(b.id), label: b.name })),
                  ]}
                  error={fieldErrors.brand_id}
                />
              </div>

              <div className={styles.grid2}>
                <Select
                  label="حالة الجهاز"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  options={CONDITION_OPTIONS}
                  required
                  error={fieldErrors.condition}
                />

                <Input
                  label="وصف مختصر يظهر في البطاقات"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  placeholder="وصف موجز يبرز أهم ميزة..."
                />
              </div>

              <div className={styles.textareaGroup}>
                <label className={styles.label}>الوصف التفصيلي للجهاز</label>
                <textarea
                  className={styles.textarea}
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="أدخل الوصف الكامل، حالة المنافذ، الشاشة، والبطارية..."
                />
              </div>

              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>معروض للبيع في المتجر (نشط)</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                  />
                  <span>معروض بالواجهة الرئيسية</span>
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Pricing & Stock */}
          <section id="pricing" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{adminAr.products.sectionPriceStock}</h2>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.grid3}>
                <Input
                  label={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      السعر الأساسي بالدرهم (AED)
                      <span className={styles.adminBadge}>للإدارة فقط</span>
                    </span>
                  }
                  type="number"
                  name="price_aed"
                  value={formData.price_aed}
                  onChange={handleInputChange}
                  placeholder="مثال: 1200"
                  min="1"
                  dir="ltr"
                  required
                  error={fieldErrors.price_aed}
                  helperText={
                    liveSdgPrice
                      ? `= ${formatSdg(liveSdgPrice)} بسعر صرف اليوم (${currentRate} ج.س)`
                      : 'يتم احتساب السعر بـ ج.س تلقائياً بناءً على سعر الصرف'
                  }
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className={styles.label}>الكمية في المخزون</label>
                  <Stepper
                    value={formData.stock_quantity}
                    min={0}
                    onChange={handleStockStepperChange}
                    ariaLabel="تعديل مخزون الجهاز"
                  />
                  {fieldErrors.stock_quantity && (
                    <span role="alert" style={{ color: 'var(--wex-danger)', fontSize: 'var(--text-xs, 12px)' }}>
                      {fieldErrors.stock_quantity}
                    </span>
                  )}
                </div>

                <Input
                  label="ملاحظات إضافية على حالة الجهاز (اختياري)"
                  name="warranty_text"
                  value={formData.warranty_text}
                  onChange={handleInputChange}
                  placeholder="أي تفاصيل أو ملاحظات خاصة بحالة الجهاز"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Photos Management */}
          <section id="photos" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{adminAr.products.sectionPhotos}</h2>
            </div>
            <div className={styles.sectionBody}>
              <ImageManager
                productId={isEditMode ? id : null}
                images={images}
                onImagesChange={setImages}
                queuedFiles={queuedFiles}
                onQueuedFilesChange={setQueuedFiles}
              />
            </div>
          </section>

          {/* Section 4: Specifications Editor */}
          <section id="specs" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{adminAr.products.specsEditorTitle}</h2>
              <div className={styles.presetsBar}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySpecsPreset('laptop')}
                >
                  {adminAr.products.specsPresetLaptop}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySpecsPreset('phone')}
                >
                  {adminAr.products.specsPresetPhone}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySpecsPreset('accessory')}
                >
                  {adminAr.products.specsPresetAccessory}
                </Button>
              </div>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.specsList}>
                {specsList.map((spec, index) => (
                  <div key={index} className={styles.specRow}>
                    <input
                      type="text"
                      className={styles.specInput}
                      value={spec.key}
                      placeholder="الخاصية (مثلاً: الرام)"
                      onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.specInput}
                      value={spec.value}
                      placeholder="القيمة (مثلاً: 16GB DDR4)"
                      onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.deleteIconBtn}
                      onClick={() => handleRemoveSpecRow(index)}
                      title="حذف الخاصية"
                      aria-label="حذف الخاصية"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSpecRow}>
                  <Plus size={14} />
                  <span>{adminAr.products.addCustomSpec}</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Section 5: Compatible Accessories (Edit mode only) */}
          {isEditMode && (formData.type === 'laptop' || formData.type === 'phone') && (
            <section id="accessories" className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{adminAr.products.compatibleAccessories}</h2>
              </div>
              <div className={styles.sectionBody}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Select
                    value={selectedAccessoryId}
                    onChange={(e) => setSelectedAccessoryId(e.target.value)}
                    options={[
                      { value: '', label: 'اختر ملحقاً لربطه...' },
                      ...allAccessories.map((acc) => ({
                        value: String(acc.id),
                        label: `${acc.name} (${formatAed(acc.price_aed)})`,
                      })),
                    ]}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={!selectedAccessoryId || linkingAccessory}
                    loading={linkingAccessory}
                    onClick={handleLinkAccessory}
                  >
                    {adminAr.products.linkAccessory}
                  </Button>
                </div>

                {accessories.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                    لم يتم ربط أي ملحقات بهذا الجهاز بعد.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {accessories.map((acc) => (
                      <div
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--color-ice)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-slate-200)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-navy)' }}>
                            {acc.name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                            {formatAed(acc.price_aed)} · مخزون: {acc.stock_quantity}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleUnlinkAccessory(acc.id)}
                        >
                          {adminAr.products.unlinkAccessory}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Sticky Bottom Action Bar */}
          <div className={styles.stickyBottomBar} role="region" aria-label="شريط حفظ التعديلات">
            <div className={styles.bottomBarInfo}>
              {isDirty && <span className={styles.dirtyDot} title="توجد تعديلات غير محفوظة" />}
              <span className={styles.bottomBarStatus}>{isDirty ? 'توجد تعديلات غير محفوظة' : 'جميع البيانات محفوظة'}</span>
            </div>
            <div className={styles.bottomBarActions}>
              <Link to="/admin/products">
                <Button type="button" variant="ghost" size="md">
                  إلغاء
                </Button>
              </Link>

              {isEditMode && (
                <Link
                  to={getProductUrl(productSlug || id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={adminAr.products.previewInStore}
                >
                  <Button type="button" variant="outline" size="md" tabIndex={-1}>
                    <ExternalLink size={16} />
                    <span className={styles.previewLabel}>{adminAr.products.previewInStore}</span>
                  </Button>
                </Link>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={submitting}
                className={styles.saveBtn}
              >
                <Check size={16} />
                <span>{isEditMode ? adminAr.products.saveProduct : adminAr.products.createProduct}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}
