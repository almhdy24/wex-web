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
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  PackageX,
  Undo2,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { adminAr } from '../../content/admin.ar';
import { formatAed, formatSdg, resolveImageUrl, formatCondition } from '../../utils/formatters';
import { getProductUrl } from '../../utils/productUrl';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ErrorState from '../../components/common/ErrorState';
import DataList from '../../components/admin/DataList';
import FilterBar from '../../components/admin/FilterBar';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Stepper from '../../components/admin/Stepper';
import Page from '../../components/common/Page';
import ProductImage from '../../components/common/ProductImage';
import EmptyState from '../../components/common/EmptyState';
import styles from './AdminProductsPage.module.css';
import l from './AdminProductsList.module.css';

const TABS = [
  { value: '', label: 'الكل', count: 'all' },
  { value: 'laptop', label: 'حواسيب', count: 'laptop' },
  { value: 'phone', label: 'هواتف', count: 'phone' },
  { value: 'accessory', label: 'ملحقات', count: 'accessory' },
];
const STATUS_CHIPS = [
  { value: '', label: 'الكل' },
  { value: 'published', label: 'منشور' },
  { value: 'draft', label: 'مسودة', count: 'draft' },
  { value: 'hidden', label: 'مخفي', count: 'hidden' },
  { value: 'out', label: 'نفد', count: 'out_of_stock' },
  { value: 'review', label: 'تحتاج مراجعة', count: 'needs_review' },
];
const SORTS = [
  { value: '', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'price_asc', label: 'السعر: الأقل أولاً' },
  { value: 'price_desc', label: 'السعر: الأعلى أولاً' },
  { value: 'stock_asc', label: 'المخزون: الأقل أولاً' },
  { value: 'name', label: 'الاسم' },
];

/** Semantic status of a product row. */
function statusOf(p) {
  if (Number(p.is_draft) === 1 || p.is_draft === true) return 'draft';
  if (!(Number(p.is_active) === 1 || p.is_active === true)) return 'hidden';
  if (Number(p.stock_quantity) <= 0) return 'out';
  return 'published';
}
const STATUS_META = {
  published: ['منشور', l.pillPublished],
  draft: ['مسودة', l.pillDraft],
  hidden: ['مخفي', l.pillHidden],
  out: ['نفد', l.pillOut],
};
function StatusPill({ product }) {
  const [label, cls] = STATUS_META[statusOf(product)];
  return (
    <span className={`${l.pill} ${cls}`}>
      {label}
      {product.needs_review ? <span className={l.reviewDot} title="تحتاج مراجعة المواصفات" /> : null}
    </span>
  );
}

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

  // Tab counts, view mode, bulk price, undo bar
  const [counts, setCounts] = useState(null);
  const [view, setView] = useState(() => {
    try { return window.localStorage.getItem('wex_admin_products_view') || 'list'; } catch { return 'list'; }
  });
  const [priceMode, setPriceMode] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [undo, setUndo] = useState(null); // { ids: number[], label: string }


  // Read URL search params
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category_id') || '';
  const typeFilter = searchParams.get('type') || '';
  const brandFilter = searchParams.get('brand_id') || '';
  const conditionFilter = searchParams.get('condition') || '';
  const stockFilter = searchParams.get('stock') || '';
  const activeFilter = searchParams.get('is_active') || '';
  const statusFilter = searchParams.get('status') || '';
  const sortFilter = searchParams.get('sort') || '';
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
      if (brandFilter) params.brand_id = brandFilter;
      if (conditionFilter) params.condition = conditionFilter;
      if (sortFilter) params.sort = sortFilter;
      if (statusFilter === 'review') params.needs_review = 1;
      else if (statusFilter) params.status = statusFilter;
      if (stockFilter === 'out_of_stock') params.out_of_stock = 1;

      const res = await adminApi.getProducts(params);
      let items = res.data || [];

      // Remaining stock filters are applied to the loaded page only.
      if (stockFilter === 'in_stock') {
        items = items.filter((p) => p.stock_quantity > 0);
      } else if (stockFilter === 'low_stock') {
        items = items.filter((p) => p.stock_quantity === 1 || p.stock_quantity === 2);
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
  }, [searchQuery, categoryFilter, typeFilter, activeFilter, conditionFilter, brandFilter, stockFilter, statusFilter, sortFilter, currentPage]);

  const loadCounts = useCallback(() => {
    adminApi.getProductCounts().then((r) => setCounts(r.data || null)).catch(() => {});
  }, []);
  useEffect(() => { loadCounts(); }, [loadCounts, products.length]);

  const changeView = (v) => {
    setView(v);
    try { window.localStorage.setItem('wex_admin_products_view', v); } catch { /* ignore */ }
  };

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

  // Duplicate: opens the new-product form pre-filled with this product (nothing is created until saved).
  const handleDuplicateProduct = (product) => {
    navigate(`/admin/products/new?copy=${product.id}`);
  };

  // Mark out of stock (quick action)
  const handleMarkOut = async (product) => {
    await handleStockChange(product.id, 0);
    loadCounts();
  };

  const undoTimer = React.useRef(null);
  const showUndo = (ids, label) => {
    setUndo({ ids, label });
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 8000);
  };
  const handleUndo = async () => {
    if (!undo) return;
    const { ids } = undo;
    window.clearTimeout(undoTimer.current);
    setUndo(null);
    try {
      await Promise.all(ids.map((pid) => adminApi.restoreProduct(pid)));
      success('تم استرجاع المنتجات');
      fetchProducts();
      loadCounts();
    } catch {
      toastError('تعذر استرجاع بعض المنتجات');
    }
  };

  const handleBulkPrice = async () => {
    const price = Number(String(bulkPrice).replace(/[^\d]/g, ''));
    if (!price || price <= 0) {
      toastError('أدخل سعراً صحيحاً أكبر من صفر');
      return;
    }
    try {
      setBulkProcessing(true);
      await Promise.all(selectedIds.map((pid) => adminApi.updateProduct(pid, { price_aed: price })));
      success('تم تحديث سعر المنتجات المحددة');
      setSelectedIds([]);
      setPriceMode(false);
      setBulkPrice('');
      fetchProducts();
    } catch {
      toastError('تعذر تحديث سعر بعض المنتجات');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Delete Product Confirmed
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteProduct(deleteDialog.product.id);
      showUndo([deleteDialog.product.id], deleteDialog.product.name);
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
      showUndo(selectedIds, `${selectedIds.length} منتجات`);
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
          p.image?.thumb_path || p.thumb_url || p.primary_image || p.image_path || (p.images && p.images[0]?.thumb_path)
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
      label: 'الحالة',
      isStatus: true,
      render: (p) => <StatusPill product={p} />,
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
            onClick={() => handleToggleActive(p)}
            title={Number(p.is_active) === 1 ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
            aria-label={Number(p.is_active) === 1 ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
          >
            {Number(p.is_active) === 1 ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            className={styles.actionIconBtn}
            onClick={() => handleMarkOut(p)}
            title="تحديد كنفد"
            aria-label="تحديد كنفد"
          >
            <PackageX size={14} />
          </button>
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
      p.image?.thumb_path || p.thumb_url || p.primary_image || p.image_path || (p.images && p.images[0]?.thumb_path)
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
              {(p.brand_name || p.brand?.name) ? (
                <>
                  <span className={styles.mobileBrand}>{p.brand_name || p.brand?.name}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span>{formatCondition(p.condition)}</span>
            </div>
          </div>

          <div className={styles.mobileStatusChip}>
            <StatusPill product={p} />
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
                <span className={styles.lowStockAlert}>
                  <AlertTriangle size={12} className={styles.lowStockIcon} aria-hidden="true" />
                  <span>منخفض ({p.stock_quantity})</span>
                </span>
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

  const renderGridCard = (p) => {
    const thumb = resolveImageUrl(p.image?.thumb_path || p.thumb_url || p.primary_image || p.image_path);
    return (
      <div key={p.id} className={l.gridCard}>
        <label className={l.gridSelect} aria-label={`تحديد ${p.name}`}>
          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => handleToggleSelectOne(p.id)} />
        </label>
        <Link to={`/admin/products/${p.id}/edit`} className={l.gridThumbLink}>
          <ProductImage src={thumb} alt={p.name} type={p.type || 'laptop'} className={l.gridThumb} />
        </Link>
        <div className={l.gridBody}>
          <Link to={`/admin/products/${p.id}/edit`} className={l.gridTitle}>{p.name}</Link>
          <div className={l.gridMeta}>
            <span className={l.gridPrice}>{p.price_sdg ? formatSdg(p.price_sdg) : '—'}</span>
            <StatusPill product={p} />
          </div>
          <span className={l.gridStock}>المخزون: {p.stock_quantity}</span>
        </div>
        <div className={l.gridActions}>
          <button type="button" className={styles.actionIconBtn} onClick={() => handleToggleActive(p)} aria-label={Number(p.is_active) === 1 ? 'إخفاء من المتجر' : 'إظهار في المتجر'}>
            {Number(p.is_active) === 1 ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" className={styles.actionIconBtn} onClick={() => handleMarkOut(p)} aria-label="تحديد كنفد"><PackageX size={16} /></button>
          <button type="button" className={styles.actionIconBtn} onClick={() => handleDuplicateProduct(p)} aria-label="نسخ المنتج"><Copy size={16} /></button>
          <Link to={`/admin/products/${p.id}/edit`} className={styles.actionIconBtn} aria-label="تعديل الجهاز"><Edit size={16} /></Link>
        </div>
      </div>
    );
  };

  const hasFilters = Boolean(searchQuery || typeFilter || statusFilter || activeFiltersCount);

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

      {/* Category tabs with counts */}
      <div className={l.tabs} role="tablist" aria-label="تصنيف المنتجات">
        {TABS.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            role="tab"
            aria-selected={typeFilter === t.value}
            className={`${l.tab} ${typeFilter === t.value ? l.tabActive : ''}`}
            onClick={() => updateParam('type', t.value)}
          >
            <span>{t.label}</span>
            {counts ? <span className={l.tabCount}>{counts[t.count] ?? 0}</span> : null}
          </button>
        ))}
        <div className={l.viewToggle} role="group" aria-label="طريقة العرض">
          <button type="button" className={`${l.viewBtn} ${view === 'list' ? l.viewBtnOn : ''}`} onClick={() => changeView('list')} aria-label="عرض قائمة" aria-pressed={view === 'list'}><ListIcon size={16} /></button>
          <button type="button" className={`${l.viewBtn} ${view === 'grid' ? l.viewBtnOn : ''}`} onClick={() => changeView('grid')} aria-label="عرض شبكة" aria-pressed={view === 'grid'}><LayoutGrid size={16} /></button>
        </div>
      </div>

      {/* Status chips */}
      <div className={l.chipsRow} role="group" aria-label="حالة المنتج">
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.value || 'all'}
            type="button"
            className={`${l.statusChip} ${statusFilter === c.value ? l.statusChipOn : ''}`}
            onClick={() => updateParam('status', c.value)}
          >
            {c.label}
            {c.count && counts && counts[c.count] ? <span className={l.chipCount}>{counts[c.count]}</span> : null}
          </button>
        ))}
      </div>

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
          label="الترتيب"
          value={sortFilter}
          onChange={(e) => updateParam('sort', e.target.value)}
          options={SORTS}
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
            { value: 'new', label: 'جديد' },
            { value: 'used_imported', label: 'مستعمل مستورد' },
            { value: 'refurbished', label: 'مجدّد' },
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
            {priceMode ? (
              <span className={l.bulkPrice}>
                <input
                  className={l.bulkPriceInput}
                  inputMode="numeric"
                  dir="ltr"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="السعر بالدرهم"
                  aria-label="السعر الجديد بالدرهم"
                />
                <Button variant="primary" size="sm" loading={bulkProcessing} onClick={handleBulkPrice}>تطبيق</Button>
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setPriceMode(true)}>
                <span>تغيير السعر</span>
              </Button>
            )}
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
      ) : !loading && products.length === 0 && !hasFilters ? (
        <EmptyState
          title="لا توجد منتجات بعد"
          description="ابدأ بإضافة أول جهاز إلى المتجر."
          action={(
            <Link to="/admin/products/new">
              <Button variant="primary" size="md"><Plus size={16} /><span>أضف أول منتج</span></Button>
            </Link>
          )}
        />
      ) : view === 'grid' && !loading ? (
        products.length === 0 ? (
          <EmptyState title="لا توجد نتائج مطابقة" description="جرّب تغيير الفلاتر أو البحث." />
        ) : (
          <div className={l.grid}>{products.map(renderGridCard)}</div>
        )
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

      {undo ? (
        <div className={l.undoBar} role="status" aria-live="polite">
          <span>تم حذف «{undo.label}»</span>
          <button type="button" className={l.undoBtn} onClick={handleUndo}>
            <Undo2 size={16} />
            <span>تراجع</span>
          </button>
        </div>
      ) : null}

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
