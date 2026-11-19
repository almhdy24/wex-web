import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { resolveImageUrl, formatAed } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'laptop',
    category_id: '',
    brand_id: '',
    condition: 'used',
    price_aed: '',
    stock_quantity: '1',
    warranty_text: 'ضمان فحص وتشغيل لمدة 7 أيام',
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
    { key: 'مقاس الشاشة', value: '' },
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
        const [catRes, brandRes] = await Promise.all([
          adminApi.getCategories(),
          adminApi.getBrands(),
        ]);
        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
      } catch (err) {
        showToast('فشل في تحميل الفئات أو الماركات', 'error');
      }
    };
    fetchMetadata();
  }, []);

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
              const entries = Object.entries(parsed).map(([k, v]) => ({
                key: k,
                value: String(v),
              }));
              if (entries.length > 0) {
                setSpecsList(entries);
              }
            }
          } catch (e) {
            console.error('Failed to parse specs JSON', e);
          }
        }

        // Fetch detailed product with images and accessories from public detail or admin
        setImages(p.images || []);
        setAccessories(p.accessories || []);
      } catch (err) {
        showToast(err.message || 'فشل في تحميل بيانات الجهاز', 'error');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode]);

  // Load available accessories for linking
  useEffect(() => {
    if (isEditMode && (formData.type === 'laptop' || formData.type === 'phone')) {
      adminApi.getProducts({ type: 'accessory', per_page: 50 }).then((res) => {
        setAllAccessories(res.data || []);
      }).catch(() => {});
    }
  }, [isEditMode, formData.type]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const applySpecsPreset = (presetType) => {
    if (presetType === 'laptop') {
      setSpecsList([
        { key: 'المعالج', value: '' },
        { key: 'الرام', value: '' },
        { key: 'التخزين', value: '' },
        { key: 'كرت الشاشة', value: '' },
        { key: 'مقاس الشاشة', value: '' },
        { key: 'البطارية', value: '' },
      ]);
    } else if (presetType === 'phone') {
      setSpecsList([
        { key: 'الذاكرة الداخلية', value: '' },
        { key: 'الرام', value: '' },
        { key: 'البطارية', value: '' },
        { key: 'الشاشة', value: '' },
        { key: 'الكاميرا', value: '' },
      ]);
    } else {
      setSpecsList([
        { key: 'النوع', value: '' },
        { key: 'التوافق', value: '' },
      ]);
    }
  };

  const handleSpecChange = (index, field, val) => {
    setSpecsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddSpecRow = () => {
    setSpecsList((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index) => {
    setSpecsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى إدخال اسم الجهاز', 'error');
      return;
    }
    if (!formData.category_id) {
      showToast('يرجى اختيار الفئة', 'error');
      return;
    }
    if (!formData.price_aed || Number(formData.price_aed) <= 0) {
      showToast('يرجى تحديد السعر بالدرهم الإماراتي', 'error');
      return;
    }

    // Construct specs object
    const specsObj = {};
    specsList.forEach((item) => {
      if (item.key.trim() && item.value.trim()) {
        specsObj[item.key.trim()] = item.value.trim();
      }
    });

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      category_id: Number(formData.category_id),
      brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      condition: formData.condition,
      price_aed: Number(formData.price_aed),
      stock_quantity: Number(formData.stock_quantity || 0),
      warranty_text: formData.warranty_text.trim() || null,
      short_description: formData.short_description.trim() || null,
      description: formData.description.trim() || null,
      specs: specsObj,
      is_active: formData.is_active ? 1 : 0,
      is_featured: formData.is_featured ? 1 : 0,
    };

    try {
      setSubmitting(true);
      if (isEditMode) {
        await adminApi.updateProduct(id, payload);
        showToast('تم تحديث بيانات الجهاز بنجاح', 'success');
      } else {
        const res = await adminApi.createProduct(payload);
        showToast('تم إنشاء الجهاز بنجاح', 'success');
        if (res.data?.id) {
          navigate(`/admin/products/${res.data.id}/edit`);
          return;
        }
        navigate('/admin/products');
      }
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الجهاز', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('images[]', files[i]);
    }

    try {
      setUploadingImages(true);
      const res = await adminApi.uploadProductImages(id, fd);
      showToast('تم رفع الصور بنجاح', 'success');
      // Refresh product data
      const prodRes = await adminApi.getProduct(id);
      setImages(prodRes.data?.images || []);
      // Reset input
      e.target.value = '';
    } catch (err) {
      showToast(err.message || 'فشل في رفع الصور', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      await adminApi.updateProductImage(id, imageId, { is_primary: 1 });
      showToast('تم تعيين الصورة كصورة رئيسية', 'success');
      const prodRes = await adminApi.getProduct(id);
      setImages(prodRes.data?.images || []);
    } catch (err) {
      showToast(err.message || 'فشل في تعيين الصورة الرئيسية', 'error');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      await adminApi.deleteProductImage(id, imageId);
      showToast('تم حذف الصورة', 'success');
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      showToast(err.message || 'فشل في حذف الصورة', 'error');
    }
  };

  // Accessory linking
  const handleLinkAccessory = async (e) => {
    e.preventDefault();
    if (!selectedAccessoryId) return;

    try {
      setLinkingAccessory(true);
      await adminApi.linkAccessory(id, selectedAccessoryId);
      showToast('تم ربط الملحق بنجاح', 'success');
      const prodRes = await adminApi.getProduct(id);
      setAccessories(prodRes.data?.accessories || []);
      setSelectedAccessoryId('');
    } catch (err) {
      showToast(err.message || 'فشل ربط الملحق', 'error');
    } finally {
      setLinkingAccessory(false);
    }
  };

  const handleUnlinkAccessory = async (accessoryId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء ربط هذا الملحق؟')) return;
    try {
      await adminApi.unlinkAccessory(id, accessoryId);
      showToast('تم إلغاء ربط الملحق', 'success');
      setAccessories((prev) => prev.filter((a) => a.id !== accessoryId));
    } catch (err) {
      showToast(err.message || 'فشل إلغاء ربط الملحق', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Skeleton height="40px" width="300px" className="mb-4" />
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEditMode ? `تعديل الجهاز: ${formData.name || ''}` : 'إضافة جهاز جديد'}
          </h1>
          <p className="admin-page-subtitle">
            {isEditMode ? 'تحديث المواصفات، المخزون، الصور، والملحقات' : 'أدخل بيانات الجهاز والمواصفات الفنية'}
          </p>
        </div>
        <Link to="/admin/products" className="btn btn-secondary">
          العودة لقائمة الأجهزة
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {/* Main Info Card */}
          <div className="card">
            <h2 className="admin-section-heading">المعلومات الأساسية</h2>

            <div className="form-group mb-3">
              <label className="form-label required">اسم الجهاز كاملاً</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثال: Dell Latitude 5420 i7 11th Gen 16GB 512GB SSD"
                className="form-control"
                required
              />
            </div>

            <div className="row g-3 mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label required">نوع المنتج</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="laptop">لابتوب (Laptop)</option>
                  <option value="phone">هاتف ذكي (Phone)</option>
                  <option value="accessory">ملحق / ملحقات (Accessory)</option>
                </select>
              </div>

              <div>
                <label className="form-label required">الفئة</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">اختر الفئة...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ar} {c.name_en ? `(${c.name_en})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">الماركة (Brand)</label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">بدون ماركة محددة</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label required">حالة الجهاز (Condition)</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="brand_new">جديد بالكرتونة (Brand New)</option>
                  <option value="open_box">كرتونة مفتوحة (Open Box)</option>
                  <option value="used">مستعمل بحالة ممتازة (Used)</option>
                  <option value="refurbished">مجدد معتمد (Refurbished)</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label required">السعر الأساسي بالدرهم الإماراتي (AED)</label>
                <input
                  type="number"
                  name="price_aed"
                  value={formData.price_aed}
                  onChange={handleInputChange}
                  placeholder="مثال: 1200"
                  min="1"
                  className="form-control font-semibold"
                  required
                />
                <span className="text-muted text-xs">
                  يتم التحويل للسوداني تلقائياً في المتجر بناءً على سعر الصرف اليومي.
                </span>
              </div>

              <div>
                <label className="form-label required">الكمية في المخزون</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label className="form-label">نص الضمان المرفق</label>
                <input
                  type="text"
                  name="warranty_text"
                  value={formData.warranty_text}
                  onChange={handleInputChange}
                  placeholder="مثال: ضمان فحص 7 أيام"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">وصف مختصر (يظهر في البطاقات والمشاركات)</label>
              <input
                type="text"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="وصف سريع يبرز أهم ميزات الجهاز..."
                className="form-control"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">الوصف التفصيلي للجهاز</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="أدخل الوصف الكامل للجهاز، حالة البطارية، الهيكل الخارجي، والمرفقات..."
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span className="font-semibold">معروض للبيع في المتجر (نشط)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                />
                <span className="font-semibold">جهاز مميز (يظهر في العروض والصفحة الرئيسية)</span>
              </label>
            </div>
          </div>

          {/* Specifications Builder Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="admin-section-heading mb-1">المواصفات الفنية التفصيلية</h2>
                <p className="text-muted text-sm">تظهر في جدول المواصفات بصفحة تفاصيل الجهاز</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => applySpecsPreset('laptop')}
                >
                  قالب لابتوب
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => applySpecsPreset('phone')}
                >
                  قالب هاتف
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {specsList.map((spec, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr auto',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    value={spec.key}
                    placeholder="اسم الخاصية (مثلاً: الرام)"
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    className="form-control"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    placeholder="القيمة (مثلاً: 16GB DDR4)"
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    className="form-control"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    title="حذف هذا الحقل"
                    onClick={() => handleRemoveSpecRow(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm mt-3"
              onClick={handleAddSpecRow}
            >
              + إضافة خاصية جديدة
            </button>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Link to="/admin/products" className="btn btn-secondary">
              إلغاء
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : isEditMode ? 'حفظ التعديلات' : 'إضافة الجهاز والمتابعة'}
            </button>
          </div>
        </div>
      </form>

      {/* Additional Management Sections (Only in Edit Mode) */}
      {isEditMode && (
        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Images Management Card */}
          <div className="card">
            <h2 className="admin-section-heading">إدارة صور الجهاز</h2>
            <p className="text-muted text-sm mb-4">
              يمكنك رفع صور متعددة، تحديد الصورة الرئيسية للمتجر، أو حذف الصور.
            </p>

            <div className="admin-image-upload-box mb-4">
              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                {uploadingImages ? 'جاري الرفع...' : 'اختر صوراً للرفع'}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  style={{ display: 'none' }}
                />
              </label>
              <span className="text-muted text-xs ms-2">
                صيغ مدعومة: JPG, PNG, WEBP (بحد أقصى 5 ميجابايت لكل صورة)
              </span>
            </div>

            {images.length === 0 ? (
              <p className="text-muted text-sm">لا توجد صور مرفوعة لهذا الجهاز حتى الآن.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '16px',
                }}
              >
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="card p-2 text-center"
                    style={{
                      border: img.is_primary ? '2px solid var(--wex-cyan)' : '1px solid var(--wex-border)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={resolveImageUrl(img.thumb_path || img.path)}
                      alt="Product photo"
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                    <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {img.is_primary ? (
                        <span className="badge badge-primary text-xs">صورة رئيسية</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline text-xs"
                          onClick={() => handleSetPrimaryImage(img.id)}
                        >
                          تعيين كرئيسية
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger text-xs"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accessories Linking Card (Only for Laptops & Phones) */}
          {(formData.type === 'laptop' || formData.type === 'phone') && (
            <div className="card">
              <h2 className="admin-section-heading">الملحقات المقترحة المرتبطة</h2>
              <p className="text-muted text-sm mb-4">
                تظهر هذه الملحقات في قسم &quot;ملحقات مقترحة لهذا الجهاز&quot; في صفحة تفاصيل المنتج.
              </p>

              <form onSubmit={handleLinkAccessory} className="mb-4" style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={selectedAccessoryId}
                  onChange={(e) => setSelectedAccessoryId(e.target.value)}
                  className="form-control"
                  style={{ maxWidth: '400px' }}
                >
                  <option value="">اختر ملحقاً لربطه بهذا الجهاز...</option>
                  {allAccessories.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatAed(acc.price_aed)})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedAccessoryId || linkingAccessory}
                >
                  {linkingAccessory ? 'جاري الربط...' : 'ربط الملحق'}
                </button>
              </form>

              {accessories.length === 0 ? (
                <p className="text-muted text-sm">لم يتم ربط أي ملحقات بهذا الجهاز بعد.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>الملحق</th>
                        <th>السعر (AED)</th>
                        <th>المخزون</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessories.map((acc) => (
                        <tr key={acc.id}>
                          <td className="font-semibold">{acc.name}</td>
                          <td>{formatAed(acc.price_aed)}</td>
                          <td>{acc.stock_quantity} قطعة</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleUnlinkAccessory(acc.id)}
                            >
                              إلغاء الربط
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
