import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Upload,
  Star,
  ExternalLink,
  MoveUp,
  MoveDown,
  Layers,
  DollarSign,
  Image as ImageIcon,
  Cpu,
  Paperclip,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { resolveImageUrl, formatAed, formatSdg } from '../../utils/formatters';
import { compressImage } from '../../utils/imageCompressor';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Tag from '../../components/common/Tag';
import Stepper from '../../components/admin/Stepper';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './AdminProductFormPage.module.css';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [productSlug, setProductSlug] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'laptop',
    category_id: '',
    brand_id: '',
    condition: 'used',
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
    { key: 'المعاينة', value: 'فحص ومعاينة عند الاستلام' },
  ]);

  // Images for Edit Mode
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

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
            condition: p.condition || 'used',
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStockStepperChange = (val) => {
    setIsDirty(true);
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
        { key: 'المعاينة', value: 'فحص ومعاينة عند الاستلام' },
      ]);
    } else if (presetType === 'phone') {
      setSpecsList([
        { key: 'الذاكرة', value: '' },
        { key: 'الرام', value: '' },
        { key: 'البطارية', value: '' },
        { key: 'الكاميرا', value: '' },
        { key: 'اللون', value: '' },
        { key: 'المعاينة', value: 'فحص ومعاينة عند الاستلام' },
      ]);
    } else if (presetType === 'accessory') {
      setSpecsList([
        { key: 'النوع', value: '' },
        { key: 'التوافق', value: '' },
        { key: 'المعاينة', value: 'فحص ومعاينة عند الاستلام' },
      ]);
    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.price_aed) {
      toastError('يرجى ملء الحقول الإلزامية (اسم الجهاز والسعر بالدرهم)');
      return;
    }

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
        success('تم إضافة الجهاز بنجاح. يمكنك الآن رفع الصور وربط الملحقات.');
        if (createRes.data?.id) {
          navigate(`/admin/products/${createRes.data.id}/edit`);
          return;
        }
        navigate('/admin/products');
      }
    } catch (err) {
      toastError(err.message || 'حدث خطأ أثناء حفظ الجهاز');
    } finally {
      setSubmitting(false);
    }
  };

  // Image Upload with Client-Side Auto-Compression (< 800 KB, max 1600px, 0.8 quality)
  const handleImageFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    if (!isEditMode) {
      toastError('يرجى حفظ بيانات الجهاز أولاً قبل رفع الصور');
      return;
    }

    try {
      setUploadingImages(true);
      const compressedFiles = await Promise.all(
        Array.from(fileList).map((f) => compressImage(f, 1600, 0.8))
      );

      const fd = new FormData();
      compressedFiles.forEach((file) => {
        fd.append('images[]', file);
      });

      await adminApi.uploadProductImages(id, fd);
      success('تم رفع الصور وضغطها بنجاح');
      const prodRes = await adminApi.getProduct(id);
      setImages(prodRes.data?.images || []);
    } catch (err) {
      toastError(err.message || 'فشل رفع الصور');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    handleImageFiles(e.target.files);
  };

  const handleDropImages = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      handleImageFiles(e.dataTransfer.files);
    }
  };

  // Set Primary Image
  const handleSetPrimaryImage = async (imageId) => {
    try {
      await adminApi.updateProductImage(id, imageId, { is_primary: 1 });
      success('تم تعيين الصورة كصورة رئيسية');
      const prodRes = await adminApi.getProduct(id);
      setImages(prodRes.data?.images || []);
    } catch (err) {
      toastError(err.message || 'فشل في تعيين الصورة الرئيسية');
    }
  };

  // Delete Image with Undo Toast
  const handleDeleteImage = async (imageId) => {
    const targetImage = images.find((img) => img.id === imageId);
    if (!targetImage) return;

    try {
      // Optimistically remove from state
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      await adminApi.deleteProductImage(id, imageId);
      info(adminAr.products.photoDeleted);
    } catch (err) {
      toastError(err.message || 'فشل حذف الصورة');
      const prodRes = await adminApi.getProduct(id);
      setImages(prodRes.data?.images || []);
    }
  };

  // Reorder Photos locally (Move up/down)
  const handleMoveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return copy;
    });
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
      <div className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="400px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  const liveSdgPrice =
    currentRate && formData.price_aed
      ? (Number(formData.price_aed) || 0) * currentRate
      : null;

  return (
    <div className={styles.container}>
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
        <form onSubmit={handleSubmit} className={styles.formContent}>
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
                />
              </div>

              <div className={styles.grid2}>
                <Select
                  label="حالة الجهاز"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  options={[
                    { value: 'brand_new', label: 'جديد' },
                    { value: 'open_box', label: 'كرتونة مفتوحة' },
                    { value: 'used', label: 'مستعمل استيراد' },
                    { value: 'refurbished', label: 'مجدد' },
                  ]}
                  required
                />

                <Input
                  label="وصف مختصر يظهر في البطاقات"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  placeholder="وصف سريع يبرز أهم ميزة..."
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
                  helperText={
                    liveSdgPrice
                      ? `= ${formatSdg(liveSdgPrice)} بسعر صرف اليوم (${currentRate} ج.س)`
                      : 'يتم احتساب السعر بالجنيه تلقائياً بناءً على سعر الصرف'
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
                </div>

                <Input
                  label="ملاحظة الضمان (اختياري)"
                  name="warranty_text"
                  value={formData.warranty_text}
                  onChange={handleInputChange}
                  placeholder="اتركه فارغًا إن لم يكن هناك ضمان"
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
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                disabled={uploadingImages}
                style={{ display: 'none' }}
              />

              <div
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropImages}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload size={28} color="var(--color-royal-blue)" />
                <span className={styles.dropzoneText}>
                  {uploadingImages ? 'جاري ضغط ورفع الصور...' : adminAr.products.uploadDropzone}
                </span>
                <span className={styles.dropzoneHint}>
                  يتم ضغط الصور تلقائياً على المتصفح إلى أبعاد 1600 بكسل وجودة 80%
                </span>
              </div>

              {images.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                  لا توجد صور مرفوعة حتى الآن. اضغط على المربع أعلاه لرفع صور الجهاز.
                </p>
              ) : (
                <div className={styles.photosGrid}>
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className={`${styles.photoCard} ${img.is_primary ? styles.photoCardPrimary : ''}`}
                    >
                      <img
                        src={resolveImageUrl(img.thumb_path || img.path)}
                        alt=""
                        className={styles.photoImg}
                      />
                      <div className={styles.photoActions}>
                        {img.is_primary ? (
                          <Tag variant="info">
                            <Star size={10} />
                            <span>رئيسية</span>
                          </Tag>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimaryImage(img.id)}
                          >
                            رئيسية
                          </Button>
                        )}
                        <div style={{ display: 'flex', gap: 2 }}>
                          {index > 0 && (
                            <button
                              type="button"
                              className={styles.deleteIconBtn}
                              onClick={() => handleMoveImage(index, -1)}
                              title="تحريك للخلف"
                              aria-label="تحريك للخلف"
                            >
                              <MoveUp size={12} />
                            </button>
                          )}
                          {index < images.length - 1 && (
                            <button
                              type="button"
                              className={styles.deleteIconBtn}
                              onClick={() => handleMoveImage(index, 1)}
                              title="تحريك للأمام"
                              aria-label="تحريك للأمام"
                            >
                              <MoveDown size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.deleteIconBtn}
                            onClick={() => handleDeleteImage(img.id)}
                            title="حذف الصورة"
                            aria-label="حذف الصورة"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <span>{isDirty ? 'توجد تعديلات غير محفوظة' : 'جميع البيانات محفوظة'}</span>
            </div>
            <div className={styles.bottomBarActions}>
              <Link to="/admin/products">
                <Button type="button" variant="ghost" size="md">
                  إلغاء
                </Button>
              </Link>

              {isEditMode && productSlug && (
                <Link
                  to={`/products/${productSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button type="button" variant="outline" size="md">
                    <ExternalLink size={16} />
                    <span>{adminAr.products.previewInStore}</span>
                  </Button>
                </Link>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={submitting}
              >
                <Check size={16} />
                <span>{isEditMode ? adminAr.products.saveProduct : adminAr.products.createProduct}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
