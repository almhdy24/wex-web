import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { formatAed, formatSdg, resolveImageUrl, formatCondition } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { TableSkeleton } from '../../components/common/Skeleton';
import styles from './AdminCommon.module.css';

export default function AdminProductsPage() {
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null, loading: false });

  // Quick stock edit state
  const [stockEditing, setStockEditing] = useState({});
  const [stockSaving, setStockSaving] = useState({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        per_page: 20,
      };
      if (search.trim()) params.q = search.trim();
      if (typeFilter) params.type = typeFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const res = await adminApi.getProducts(params);
      setProducts(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, typeFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleQuickStockSave = async (id) => {
    const newStock = stockEditing[id];
    if (newStock === undefined || newStock === '') return;
    try {
      setStockSaving((prev) => ({ ...prev, [id]: true }));
      await adminApi.updateStock(id, newStock);
      success('تم تحديث المخزون');
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_quantity: Number(newStock) } : p))
      );
      setStockEditing((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      toastError(err.message || 'فشل تحديث المخزون. حاول تاني.');
    } finally {
      setStockSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteProduct(deleteModal.product.id);
      success('تم حذف المنتج بنجاح');
      setDeleteModal({ open: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      toastError(err.message || 'فشل حذف المنتج');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getTypeLabel = (t) => {
    switch (t) {
      case 'laptop':
        return 'لابتوب';
      case 'phone':
        return 'هاتف';
      case 'accessory':
        return 'ملحق';
      default:
        return t || 'جهاز';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>إدارة المنتجات والأجهزة</h1>
          <p className={styles.subtitle}>
            عرض وإضافة وتعديل الأجهزة ومراقبة المخزون
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button variant="primary" size="md">
            <Plus size={16} />
            <span>إضافة جهاز جديد</span>
          </Button>
        </Link>
      </header>

      {/* Brand graphic divider */}
      <div className={styles.titleDivider} aria-hidden="true" />

      {/* Filter and Search Bar */}
      <div className={styles.toolbarCard}>
        <form onSubmit={handleSearchSubmit} className={styles.toolbarForm}>
          <Input
            placeholder="ابحث بالاسم أو الموديل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'جميع الأنواع' },
              { value: 'laptop', label: 'لابتوبات' },
              { value: 'phone', label: 'هواتف' },
              { value: 'accessory', label: 'ملحقات' },
            ]}
          />

          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'جميع الحالات' },
              { value: '1', label: 'معروض للبيع (نشط)' },
              { value: '0', label: 'غير معروض' },
            ]}
          />

          <Button type="submit" variant="primary" size="md">
            بحث
          </Button>
        </form>
      </div>

      {/* Main Content */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أجهزة"
          description="لا توجد أجهزة تطابق معايير البحث الحالية."
        />
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>الصورة</th>
                  <th>اسم الجهاز</th>
                  <th>النوع / الحالة</th>
                  <th>السعر (AED)</th>
                  <th>السعر (SDG)</th>
                  <th>المخزون الحالي</th>
                  <th>الحالة</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isEditingThisStock = stockEditing[p.id] !== undefined;
                  const thumb = resolveImageUrl(
                    p.primary_image || p.image_path || (p.images && p.images[0]?.thumb_path)
                  );
                  return (
                    <tr key={p.id}>
                      <td>
                        <img
                          src={thumb}
                          alt={p.name}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: 'contain',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-white)',
                            border: '1px solid var(--color-border-subtle)',
                          }}
                          onError={(e) => {
                            e.target.src = '/favicon.svg';
                          }}
                        />
                      </td>
                      <td>
                        <div>
                          <Link
                            to={`/products/${p.slug}`}
                            target="_blank"
                            style={{
                              fontWeight: 700,
                              color: 'var(--color-navy)',
                              textDecoration: 'none',
                              fontSize: 'var(--text-sm)',
                            }}
                          >
                            {p.name}
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>
                            {p.brand_name ? `${p.brand_name} · ` : ''}
                            {p.category_name || ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <Tag variant="neutral">{getTypeLabel(p.type)}</Tag>
                          <Tag variant="info">{formatCondition(p.condition)}</Tag>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {formatAed(p.price_aed)}
                      </td>
                      <td className={styles.totalPrice}>
                        {p.price_sdg ? formatSdg(p.price_sdg) : '—'}
                      </td>
                      <td>
                        {isEditingThisStock ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min="0"
                              value={stockEditing[p.id]}
                              onChange={(e) =>
                                setStockEditing({ ...stockEditing, [p.id]: e.target.value })
                              }
                              style={{
                                width: '60px',
                                padding: '4px 6px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                fontSize: 'var(--text-xs)',
                              }}
                            />
                            <button
                              type="button"
                              disabled={stockSaving[p.id]}
                              onClick={() => handleQuickStockSave(p.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-success)',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                              aria-label="حفظ المخزون"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = { ...stockEditing };
                                delete copy[p.id];
                                setStockEditing(copy);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-slate-400)',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                              aria-label="إلغاء تعديل المخزون"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                color:
                                  p.stock_quantity <= 0
                                    ? 'var(--color-danger)'
                                    : p.stock_quantity <= 2
                                    ? 'var(--color-warning-text)'
                                    : 'var(--color-navy)',
                              }}
                            >
                              {p.stock_quantity}
                            </span>
                            <button
                              type="button"
                              title="تعديل سريع للمخزون"
                              onClick={() =>
                                setStockEditing({ ...stockEditing, [p.id]: p.stock_quantity })
                              }
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-slate-400)',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {Number(p.is_active) === 1 ? (
                          <Tag variant="success">معروض</Tag>
                        ) : (
                          <Tag variant="warning">غير معروض</Tag>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Link to={`/admin/products/${p.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setDeleteModal({ open: true, product: p, loading: false })
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta.total_pages > 1 && (
            <nav className={styles.pagination} aria-label="تنقل الصفحات">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                السابق
              </Button>
              <span className={styles.pageCount}>
                صفحة {meta.page} من {meta.total_pages} (الإجمالي: {meta.total} جهاز)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((prev) => Math.min(meta.total_pages, prev + 1))}
              >
                التالي
              </Button>
            </nav>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null, loading: false })}
        title="تأكيد حذف الجهاز"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModal({ open: false, product: null, loading: false })}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              loading={deleteModal.loading}
              onClick={handleDeleteConfirm}
            >
              تأكيد الحذف
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-slate-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
          هل أنت متأكد من رغبتك في حذف الجهاز:
          <br />
          <strong>{deleteModal.product?.name}</strong>؟
          <br />
          سيتم إزالة الجهاز وصوره من المتجر بشكل نهائي.
        </p>
      </Modal>
    </div>
  );
}
