import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Plus, Trash2, Check, Upload, Star } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { resolveImageUrl, formatAed, formatSdg } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Tag from '../../components/common/Tag';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './AdminCommon.module.css';

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

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'laptop',
    category_id: '',
    brand_id: '',
    condition: 'used',
    price_aed: '',
    stock_quantity: '1',
    warranty_text: 'ضمان فحص 7 أيام',
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
  ]);

  // Images for Edit Mode
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Accessories for Edit Mode
  const [accessories, setAccessories] = useState([]);
  const [allAccessories, setAllAccessories] = useState([]);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('');
  const [linkingAccessory, setLinkingAccessory] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes, rateRes] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getBrands(),
          adminApi.getRates({ per_page: 1 }),
        ]);
        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
        const rateItems = rateRes.data || [];
        if (rateItems.length > 0) {
          setCurrentRate(rateItems[0].rate_sdg || rateItems[0].rate || null);
        }
      } catch {
        toastError('فشل في تحميل الفئات أو الماركات أو سعر الصرف');
      }
    };
    fetchMetadata();
  }, [toastError]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getProduct(id);
        const p = res.data;
        if (!p) throw new Error('المنتج غير موجود');

        setFormData({
          name: p.name || '',
          type: p.type || 'laptop',
          category_id: p.category_id || '',
          brand_id: p.brand_id || '',
          condition: p.condition || 'used',
          price_aed: p.price_aed || '',
          stock_quantity: p.stock_quantity ?? '1',
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
            // ignore JSON error
          }
        }

        setImages(p.images || []);
        setAccessories(p.accessories || []);
      } catch (err) {
        toastError(err.message || 'تعذر تحميل بيانات الجهاز');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode, toastError]);

  // Load accessories list in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchAccessories = async () => {
      try {
        const res = await adminApi.getProducts({ type: 'accessory', per_page: 100 });
        setAllAccessories(res.data || []);
      } catch {
        // ignore
      }
    };
    fetchAccessories();
  }, [isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSpecChange = (index, field, value) => {
    setSpecsList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSpecRow = () => {
    setSpecsList((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index) => {
    setSpecsList((prev) => prev.filter((_, i) => i !== index));
  };

  const applySpecsPreset = (presetType) => {
    if (presetType === 'laptop') {
      setSpecsList([
        { key: 'المعالج', value: '' },
        { key: 'الرام', value: '' },
        { key: 'التخزين', value: '' },
        { key: 'كرت الشاشة', value: '' },
        { key: 'الشاشة', value: '' },
      ]);
    } else if (presetType === 'phone') {
      setSpecsList([
        { key: 'الذاكرة', value: '' },
        { key: 'الرام', value: '' },
        { key: 'البطارية', value: '' },
        { key: 'الكاميرا', value: '' },
        { key: 'حالة البطارية', value: '' },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        success('تم تحديث بيانات الجهاز');
      } else {
        const createRes = await adminApi.createProduct(payload);
        success('تم إضافة الجهاز بنجاح');
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

  // Image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('images[]', files[i]);
    }

    try {
      setUploadingImages(true);
      await adminApi.uploadProductImages(id, fd);
      success('تم رفع الصور بنجاح');
      const prodRes = await adminApi.getProduct(id);
      setImages(prodRes.data?.images || []);
      e.target.value = '';
    } catch (err) {
      toastError(err.message || 'فشل في رفع الصور');
    } finally {
      setUploadingImages(false);
    }
  };

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

  const handleDeleteImage = async (imageId) => {
    try {
      await adminApi.deleteProductImage(id, imageId);
      success('تم حذف الصورة');
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      toastError(err.message || 'فشل حذف الصورة');
    }
  };

  // Accessory linking
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

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="36px" width="300px" />
        <div style={{ height: 16 }} />
        <Skeleton height="400px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <Link
            to="/admin/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-500)',
              textDecoration: 'none',
              marginBottom: 4,
            }}
          >
            <ArrowRight size={14} />
            <span>العودة لقائمة الأجهزة</span>
          </Link>
          <h1 className={styles.title}>
            {isEditMode ? `تعديل الجهاز: ${formData.name || ''}` : 'إضافة جهاز جديد'}
          </h1>
          <p className={styles.subtitle}>
            {isEditMode ? 'تحديث المواصفات، المخزون، الصور، والملحقات' : 'أدخل بيانات الجهاز والمواصفات الفنية'}
          </p>
        </div>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Main Info Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>المعلومات الأساسية</h2>
            </div>
            <div className={styles.cardBody}>
              <Input
                label="اسم الجهاز كاملاً"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثال: Dell Latitude 5420 i7 11th Gen 16GB 512GB SSD"
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
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
                  label="الفئة"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  options={[
                    { value: '', label: 'اختر الفئة...' },
                    ...categories.map((c) => ({ value: String(c.id), label: c.name_ar })),
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <Input
                  label={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      السعر الأساسي بالدرهم (AED)
                      <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
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
                    currentRate && formData.price_aed
                      ? `= ${formatSdg((Number(formData.price_aed) || 0) * currentRate)} بالسعر الحالي`
                      : 'يتم تحويله للسوداني تلقائياً بسعر الصرف المعتمد'
                  }
                />

                <Input
                  label="الكمية في المخزون"
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  dir="ltr"
                  required
                />

                <Input
                  label="نص الضمان"
                  name="warranty_text"
                  value={formData.warranty_text}
                  onChange={handleInputChange}
                  placeholder="مثال: ضمان فحص 7 أيام"
                />
              </div>

              <Input
                label="وصف مختصر"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="وصف سريع يبرز أهم مواصفات الجهاز..."
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-slate-700)' }}>
                  الوصف التفصيلي للجهاز
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="أدخل الوصف الكامل، حالة المنافذ، الشاشة، والبطارية..."
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    style={{ accentColor: 'var(--color-royal-blue)' }}
                  />
                  <span>معروض للبيع في المتجر (نشط)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    style={{ accentColor: 'var(--color-royal-blue)' }}
                  />
                  <span>عرض في الواجهة الرئيسية</span>
                </label>
              </div>
            </div>
          </div>

          {/* Specifications Builder */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>المواصفات الفنية</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySpecsPreset('laptop')}
                >
                  قالب لابتوب
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySpecsPreset('phone')}
                >
                  قالب هاتف
                </Button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {specsList.map((spec, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr auto',
                      gap: 'var(--space-2)',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      value={spec.key}
                      placeholder="الخاصية (مثلاً: الرام)"
                      onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                    <input
                      type="text"
                      value={spec.value}
                      placeholder="القيمة (مثلاً: 16GB DDR4)"
                      onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecRow(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      aria-label="حذف الخاصية"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSpecRow}>
                  <Plus size={14} />
                  <span>إضافة خاصية جديدة</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Link to="/admin/products">
              <Button type="button" variant="ghost">
                إلغاء
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={submitting}>
              <Check size={16} />
              <span>{isEditMode ? 'حفظ التعديلات' : 'إضافة الجهاز والمتابعة'}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Additional Management Sections in Edit Mode */}
      {isEditMode && (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Images Management */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>إدارة صور الجهاز</h2>
            </div>
            <div className={styles.cardBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploadingImages}
                    onClick={(e) => e.currentTarget.previousSibling.click()}
                  >
                    <Upload size={14} />
                    <span>اختر صوراً للرفع</span>
                  </Button>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                  JPG, PNG, WEBP (الحد الأقصى 5 ميجابايت)
                </span>
              </div>

              {images.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                  لا توجد صور مرفوعة لهذا الجهاز حتى الآن.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 'var(--space-3)',
                  }}
                >
                  {images.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        padding: 'var(--space-2)',
                        border: img.is_primary
                          ? '2px solid var(--color-royal-blue)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        backgroundColor: 'var(--color-white)',
                      }}
                    >
                      <img
                        src={resolveImageUrl(img.thumb_path || img.path)}
                        alt=""
                        style={{
                          width: '100%',
                          height: '90px',
                          objectFit: 'contain',
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                        {img.is_primary ? (
                          <Tag variant="info">
                            <Star size={10} />
                            <span>رئيسية</span>
                          </Tag>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimaryImage(img.id)}
                          >
                            تعيين كرئيسية
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accessories Linking */}
          {(formData.type === 'laptop' || formData.type === 'phone') && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>الملحقات المقترحة المرتبطة</h2>
              </div>
              <div className={styles.cardBody}>
                <form
                  onSubmit={handleLinkAccessory}
                  style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}
                >
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
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!selectedAccessoryId || linkingAccessory}
                    loading={linkingAccessory}
                  >
                    ربط الملحق
                  </Button>
                </form>

                {accessories.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                    لم يتم ربط أي ملحقات بهذا الجهاز بعد.
                  </p>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>الملحق</th>
                          <th>
                            السعر (AED) <span className={styles.adminOnlyBadge}>للإدارة فقط</span>
                          </th>
                          <th>المخزون</th>
                          <th>إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessories.map((acc) => (
                          <tr key={acc.id}>
                            <td><strong>{acc.name}</strong></td>
                            <td>{formatAed(acc.price_aed)}</td>
                            <td>{acc.stock_quantity}</td>
                            <td>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUnlinkAccessory(acc.id)}
                              >
                                إلغاء الربط
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
