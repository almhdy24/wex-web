import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  CheckSquare,
  Square,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatAed, formatSdg, resolveImageUrl, formatCondition } from '../../utils/formatters';
import { getProductUrl } from '../../utils/productUrl';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import StatusChip from '../../components/admin/StatusChip';
import Select from '../../components/common/Select';
import ErrorState from '../../components/common/ErrorState';
import DataList from '../../components/admin/DataList';
import FilterBar from '../../components/admin/FilterBar';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Stepper from '../../components/admin/Stepper';
import Page from '../../components/common/Page';
import ProductImage from '../../components/common/ProductImage';
import styles from './AdminProductsPage.module.css';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected products for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Single delete modal
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null, loading: false });

  // Bulk delete modal
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Read URL search params
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category_id') || '';
  const typeFilter = searchParams.get('type') || '';
  const brandFilter = searchParams.get('brand_id') || '';
  const conditionFilter = searchParams.get('condition') || '';
  const stockFilter = searchParams.get('stock') || '';
  const activeFilter = searchParams.get('is_active') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  // Load Categories & Brands metadata
  useEffect(() => {
    let mounted = true;
    const fetchMeta = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          adminApi.getCategories().catch(() => ({ data: [] })),
          adminApi.getBrands().catch(() => ({ data: [] })),
        ]);
        if (mounted) {
          setCategories(catsRes.data || []);
          setBrands(brandsRes.data || []);
        }
      } catch {
        // non-blocking
      }
    };
    fetchMeta();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        per_page: 20,
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (categoryFilter) params.category_id = categoryFilter;
      if (typeFilter) params.type = typeFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const res = await adminApi.getProducts(params);
      let items = res.data || [];

      // Client-side additional filtering for condition and stock status
      if (conditionFilter) {
        items = items.filter((p) => p.condition === conditionFilter);
      }
      if (brandFilter) {
        items = items.filter((p) => String(p.brand_id) === String(brandFilter));
      }
      if (stockFilter === 'in_stock') {
        items = items.filter((p) => p.stock_quantity > 0);
      } else if (stockFilter === 'low_stock') {
        items = items.filter((p) => p.stock_quantity === 1 || p.stock_quantity === 2);
      } else if (stockFilter === 'out_of_stock') {
        items = items.filter((p) => p.stock_quantity === 0);
      }

      setProducts(items);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, typeFilter, activeFilter, conditionFilter, brandFilter, stockFilter, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update query params helper
  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val !== undefined && val !== null && val !== '') {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  // Stock Quick Stepper Update
  const handleStockChange = async (productId, newQuantity) => {
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock_quantity: newQuantity } : p))
      );
      await adminApi.updateStock(productId, newQuantity);
      success(adminAr.products.stockUpdated);
    } catch (err) {
      toastError(err.message || 'فشل تحديث المخزون');
      fetchProducts();
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (product) => {
    const nextStatus = Number(product.is_active) === 1 ? 0 : 1;
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: nextStatus } : p))
      );
      await adminApi.updateProduct(product.id, { is_active: nextStatus });
      success(nextStatus === 1 ? 'تم تفعيل عرض الجهاز في المتجر' : 'تم إخفاء الجهاز من المتجر');
    } catch (err) {
      toastError(err.message || 'تعذر تعديل حالة العرض');
      fetchProducts();
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (product) => {
    const nextFeatured = Number(product.is_featured) === 1 ? 0 : 1;
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: nextFeatured } : p))
      );
      await adminApi.updateProduct(product.id, { is_featured: nextFeatured });
      success(nextFeatured === 1 ? 'تم تمييز الجهاز بالواجهة الرئيسية' : 'تم إلغاء تمييز الجهاز من الواجهة');
    } catch (err) {
      toastError(err.message || 'تعذر تعديل حالة التمييز');
      fetchProducts();
    }
  };

  // Duplicate Product ("تكرار المنتج")
  const handleDuplicateProduct = async (product) => {
    try {
      const fullRes = await adminApi.getProduct(product.id);
      const orig = fullRes.data;
      if (!orig) throw new Error('المنتج غير موجود');

      let specsObj = orig.specs;
      if (typeof specsObj === 'string') {
        try {
          specsObj = JSON.parse(specsObj);
        } catch {
          specsObj = undefined;
        }
      }

      const clonePayload = {
        name: `${orig.name} (نسخة)`,
        type: orig.type || 'laptop',
        category_id: orig.category_id || undefined,
        brand_id: orig.brand_id || undefined,
        condition: orig.condition || 'used',
        price_aed: Number(orig.price_aed),
        stock_quantity: 0,
        warranty_text: orig.warranty_text || undefined,
        short_description: orig.short_description || undefined,
        description: orig.description || undefined,
        specs: specsObj && Object.keys(specsObj).length > 0 ? specsObj : undefined,
        is_active: 0, // cloned product is inactive by default
        is_featured: 0,
      };

      const createRes = await adminApi.createProduct(clonePayload);
      success(adminAr.products.duplicateSuccess);
      if (createRes.data?.id) {
        navigate(`/admin/products/${createRes.data.id}/edit`);
      } else {
        fetchProducts();
      }
    } catch (err) {
      toastError(err.message || adminAr.products.duplicateError);
    }
  };

  // Delete Product Confirmed
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteProduct(deleteDialog.product.id);
      success('تم حذف المنتج بنجاح');
      setDeleteDialog({ open: false, product: null, loading: false });
      setSelectedIds((prev) => prev.filter((id) => id !== deleteDialog.product.id));
      fetchProducts();
    } catch (err) {
      toastError(err.message || 'فشل حذف المنتج');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // Bulk Actions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkActivate = async (activeState) => {
    try {
      setBulkProcessing(true);
      await Promise.all(
        selectedIds.map((id) => adminApi.updateProduct(id, { is_active: activeState ? 1 : 0 }))
      );
      success(activeState ? 'تم تفعيل الأجهزة المحددة بنجاح' : 'تم إخفاء الأجهزة المحددة');
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toastError(err.message || 'فشل تحديث حالة الأجهزة المحددة');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setBulkProcessing(true);
      await Promise.all(selectedIds.map((id) => adminApi.deleteProduct(id)));
      success('تم حذف الأجهزة المحددة بنجاح');
      setSelectedIds([]);
      setBulkDeleteDialog(false);
      fetchProducts();
    } catch (err) {
      toastError(err.message || 'فشل حذف بعض الأجهزة');
    } finally {
      setBulkProcessing(false);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (typeFilter) count++;
    if (brandFilter) count++;
    if (conditionFilter) count++;
    if (stockFilter) count++;
    if (activeFilter !== '') count++;
    return count;
  }, [categoryFilter, typeFilter, brandFilter, conditionFilter, stockFilter, activeFilter]);

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Define Table Columns for DataList
  const allSelected = products.length > 0 && selectedIds.length === products.length;

  const columns = [
    {
      key: 'select',
      hideOnMobile: true,
      label: (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAll(!allSelected);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectAll(!allSelected);
            }
          }}
          aria-label={allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        >
          {allSelected ? <CheckSquare size={18} color="var(--color-royal-blue)" /> : <Square size={18} />}
        </span>
      ),
      width: '44px',
      render: (p) => {
        const isChecked = selectedIds.includes(p.id);
        return (
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={isChecked}
            onChange={() => handleToggleSelectOne(p.id)}
            aria-label={`تحديد ${p.name}`}
          />
        );
      },
    },
    {
      key: 'name',
      label: 'الجهاز',
      isPrimary: true,
      render: (p) => {
        const thumb = resolveImageUrl(
          p.thumb_url || p.primary_image || p.image_path || (p.images && p.images[0]?.thumb_path)
        );
        return (
          <div className={styles.productPrimary}>
            <ProductImage
              src={thumb}
              alt={p.name}
              type={p.type || 'laptop'}
              className={styles.productThumb}
            />
            <div className={styles.productInfo}>
              <Link to={`/admin/products/${p.id}/edit`} className={styles.productTitle}>
                {p.name}
              </Link>
              <div className={styles.productMeta}>
                <span>{p.brand_name || p.brand?.name || 'ماركة غير محددة'}</span>
                <span>·</span>
                <span>{formatCondition(p.condition)}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'السعر',
      render: (p) => (
        <div className={styles.priceCol}>
          <div className={styles.priceAed}>
            <span>{formatAed(p.price_aed)}</span>
            <span className={styles.adminBadge}>للإدارة فقط</span>
          </div>
          <div className={styles.priceSdg}>
            {p.price_sdg ? formatSdg(p.price_sdg) : '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'المخزون',
      render: (p) => (
        <div className={styles.stockCol}>
          <Stepper
            value={p.stock_quantity}
            min={0}
            size="sm"
            onChange={(newVal) => handleStockChange(p.id, newVal)}
            ariaLabel={`تعديل مخزون ${p.name}`}
          />
          {p.stock_quantity <= 0 ? (
            <span className={styles.outOfStockAlert}>نفد</span>
          ) : p.stock_quantity <= 2 ? (
            <span className={styles.lowStockAlert}>منخفض</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'الحالة في المتجر',
      isStatus: true,
      render: (p) => {
        const isActive = Number(p.is_active) === 1;
        return (
          <button
            type="button"
            className={styles.actionIconBtn}
            onClick={() => handleToggleActive(p)}
            title={isActive ? 'إخفاء من المتجر' : 'تفعيل العرض في المتجر'}
            aria-label={isActive ? 'إخفاء من المتجر' : 'تفعيل العرض في المتجر'}
          >
            <StatusChip domain="visibility" status={isActive ? 'active' : 'inactive'} />
          </button>
        );
      },
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      isActions: true,
      render: (p) => (
        <div className={styles.rowActions}>
          <Link
            to={`/admin/products/${p.id}/edit`}
            className={styles.actionIconBtn}
            title="تعديل الجهاز"
            aria-label="تعديل الجهاز"
          >
            <Edit size={14} />
          </Link>
          <button
            type="button"
            className={styles.actionIconBtn}
            onClick={() => handleDuplicateProduct(p)}
            title={adminAr.products.duplicate}
            aria-label={adminAr.products.duplicate}
          >
            <Copy size={14} />
          </button>
          <Link
            to={getProductUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionIconBtn}
            title="معاينة في المتجر"
            aria-label="معاينة في المتجر"
          >
            <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
            onClick={() => setDeleteDialog({ open: true, product: p, loading: false })}
            title="حذف الجهاز"
            aria-label="حذف الجهاز"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const renderProductMobileCard = (p) => {
    const thumb = resolveImageUrl(
      p.thumb_url || p.primary_image || p.image_path || (p.images && p.images[0]?.thumb_path)
    );
    const isActive = Number(p.is_active) === 1;
    const isFeatured = Number(p.is_featured) === 1;
    const isSelected = selectedIds.includes(p.id);

    return (
      <div className={styles.mobileCard}>
        {/* Header row: Checkbox, Thumbnail, Title/Meta, Status Chip */}
        <div className={styles.mobileCardHeader}>
          <label className={styles.mobileSelectTouch} aria-label={`تحديد ${p.name}`}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={isSelected}
              onChange={() => handleToggleSelectOne(p.id)}
            />
          </label>

          <ProductImage
            src={thumb}
            alt={p.name}
            type={p.type || 'laptop'}
            className={styles.mobileThumb}
          />

          <div className={styles.mobileInfo}>
            <Link to={`/admin/products/${p.id}/edit`} className={styles.mobileTitle}>
              {p.name}
            </Link>
            <div className={styles.mobileMeta}>
              <span>{p.brand_name || p.brand?.name || 'ماركة غير محددة'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatCondition(p.condition)}</span>
            </div>
          </div>

          <div className={styles.mobileStatusChip}>
            <StatusChip domain="visibility" status={isActive ? 'active' : 'inactive'} size="sm" />
          </div>
        </div>

        {/* Key-Value Rows: Price SDG, Price AED, Stock with Stepper */}
        <div className={styles.mobileKeyValues}>
          <div className={styles.mobileKvRow}>
            <span className={styles.mobileKvLabel}>السعر بالجنيه:</span>
            <span className={styles.mobileKvValueSdg}>{p.price_sdg ? formatSdg(p.price_sdg) : '—'}</span>
          </div>

          <div className={styles.mobileKvRow}>
            <span className={styles.mobileKvLabel}>
              السعر بالدرهم <span className={styles.adminOnlyTag}>(للإدارة)</span>:
            </span>
            <span className={styles.mobileKvValueAed}>{formatAed(p.price_aed)}</span>
          </div>

          <div className={styles.mobileKvRow}>
            <span className={styles.mobileKvLabel}>المخزون المتوفر:</span>
            <div className={styles.mobileStockWrapper}>
              <Stepper
                value={p.stock_quantity}
                min={0}
                size="sm"
                onChange={(newVal) => handleStockChange(p.id, newVal)}
                ariaLabel={`تعديل مخزون ${p.name}`}
              />
              {p.stock_quantity <= 0 ? (
                <span className={styles.outOfStockAlert}>نفد</span>
              ) : p.stock_quantity <= 2 ? (
                <span className={styles.lowStockAlert}>منخفض</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Two Labeled Toggle Rows: Store active, Homepage featured */}
        <div className={styles.mobileTogglesGroup}>
          <label className={styles.mobileToggleRow}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={isActive}
              onChange={() => handleToggleActive(p)}
            />
            <span className={styles.toggleLabelText}>معروض للبيع في المتجر (نشط)</span>
          </label>

          <label className={styles.mobileToggleRow}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={isFeatured}
              onChange={() => handleToggleFeatured(p)}
            />
            <span className={styles.toggleLabelText}>معروض بالواجهة الرئيسية (مميز)</span>
          </label>
        </div>

        {/* Actions Row */}
        <div className={styles.mobileActionsRow}>
          <Link
            to={`/admin/products/${p.id}/edit`}
            className={styles.mobileActionBtn}
            title="تعديل الجهاز"
            aria-label="تعديل الجهاز"
          >
            <Edit size={16} />
            <span>تعديل</span>
          </Link>
          <button
            type="button"
            className={styles.mobileActionBtn}
            onClick={() => handleDuplicateProduct(p)}
            title="نسخ الجهاز"
            aria-label="نسخ الجهاز"
          >
            <Copy size={16} />
            <span>نسخ</span>
          </button>
          <Link
            to={getProductUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileActionBtn}
            title="معاينة في المتجر"
            aria-label="معاينة في المتجر"
          >
            <ExternalLink size={16} />
            <span>معاينة</span>
          </Link>
          <button
            type="button"
            className={`${styles.mobileActionBtn} ${styles.mobileActionBtnDanger}`}
            onClick={() => setDeleteDialog({ open: true, product: p, loading: false })}
            title="حذف الجهاز"
            aria-label="حذف الجهاز"
          >
            <Trash2 size={16} />
            <span>حذف</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <Page className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>{adminAr.products.title}</h1>
          <p className={styles.subtitle}>{adminAr.products.subtitle}</p>
        </div>
        <div className={styles.addNewBtnWrapper}>
          <Link to="/admin/products/new">
            <Button variant="primary" size="md" fullWidth>
              <Plus size={16} />
              <span>{adminAr.products.addNew}</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Decorative Ribbon */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filter and Search Bar */}
      <FilterBar
        search={searchQuery}
        onSearchChange={(val) => updateParam('q', val)}
        searchPlaceholder={adminAr.products.searchPlaceholder}
        filterCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
      >
        <Select
          label="القسم"
          value={categoryFilter}
          onChange={(e) => updateParam('category_id', e.target.value)}
          options={[
            { value: '', label: adminAr.products.allCategories },
            ...categories.map((c) => ({ value: String(c.id), label: c.name_ar || c.name })),
          ]}
        />
        <Select
          label="النوع"
          value={typeFilter}
          onChange={(e) => updateParam('type', e.target.value)}
          options={[
            { value: '', label: 'كافة الأنواع' },
            { value: 'laptop', label: 'لابتوبات' },
            { value: 'phone', label: 'هواتف' },
            { value: 'accessory', label: 'ملحقات' },
          ]}
        />
        <Select
          label="الماركة"
          value={brandFilter}
          onChange={(e) => updateParam('brand_id', e.target.value)}
          options={[
            { value: '', label: adminAr.products.allBrands },
            ...brands.map((b) => ({ value: String(b.id), label: b.name })),
          ]}
        />
        <Select
          label="الحالة"
          value={conditionFilter}
          onChange={(e) => updateParam('condition', e.target.value)}
          options={[
            { value: '', label: adminAr.products.allConditions },
            { value: 'brand_new', label: 'جديد' },
            { value: 'open_box', label: 'كرتونة مفتوحة' },
            { value: 'used', label: 'مستعمل استيراد' },
            { value: 'refurbished', label: 'مجدد' },
          ]}
        />
        <Select
          label="المخزون"
          value={stockFilter}
          onChange={(e) => updateParam('stock', e.target.value)}
          options={[
            { value: '', label: adminAr.products.stockAll },
            { value: 'in_stock', label: adminAr.products.stockInStock },
            { value: 'low_stock', label: adminAr.products.stockLow },
            { value: 'out_of_stock', label: adminAr.products.stockOut },
          ]}
        />
        <Select
          label="حالة العرض"
          value={activeFilter}
          onChange={(e) => updateParam('is_active', e.target.value)}
          options={[
            { value: '', label: 'كافة الحالات' },
            { value: '1', label: adminAr.products.activeLabel },
            { value: '0', label: adminAr.products.inactiveLabel },
          ]}
        />
      </FilterBar>

      {/* Bulk Actions Toolbar (Visible when 1 or more items selected) */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar} role="region" aria-label="الإجراءات الجماعية">
          <div className={styles.bulkInfo}>
            <span>{adminAr.products.selectedCount.replace('{count}', selectedIds.length)}</span>
          </div>
          <div className={styles.bulkActions}>
            <Button
              variant="outline"
              size="sm"
              loading={bulkProcessing}
              onClick={() => handleBulkActivate(true)}
            >
              <Eye size={14} />
              <span>{adminAr.products.bulkActivate}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={bulkProcessing}
              onClick={() => handleBulkActivate(false)}
            >
              <EyeOff size={14} />
              <span>{adminAr.products.bulkDeactivate}</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={bulkProcessing}
              onClick={() => setBulkDeleteDialog(true)}
            >
              <Trash2 size={14} />
              <span>{adminAr.products.bulkDelete}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              إلغاء التحديد
            </Button>
          </div>
        </div>
      )}

      {/* Responsive Products DataList or ErrorState */}
      {error && !loading ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : (
        <DataList
          columns={columns}
          data={products}
          loading={loading}
          mobileCardRender={renderProductMobileCard}
          emptyMessage="لم يتم العثور على أجهزة مطابقة لمعايير البحث"
          pagination={
            meta.total_pages > 1
              ? {
                  page: meta.page,
                  totalPages: meta.total_pages,
                  totalItems: meta.total,
                  onPageChange: (newPage) => updateParam('page', newPage),
                }
              : null
          }
        />
      )}

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        title={adminAr.products.deleteConfirmTitle}
        message={`هل أنت متأكد من رغبتك في حذف الجهاز "${deleteDialog.product?.name}"؟ سيتم حذفه وصوره نهائياً من المتجر.`}
        confirmText="تأكيد الحذف"
        variant="danger"
        loading={deleteDialog.loading}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="تأكيد حذف الأجهزة المحددة"
        message={`هل أنت متأكد من حذف ${selectedIds.length} جهاز محدد نهائياً من المتجر؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="تأكيد الحذف الجماعي"
        variant="danger"
        loading={bulkProcessing}
      />
    </Page>
  );
}
