import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { formatAed, formatSdg, resolveImageUrl, formatCondition } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function AdminProductsPage() {
  const { showToast } = useToast();
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
  const [stockEditing, setStockEditing] = useState({}); // { [productId]: value }
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
      setError(err.message || 'فشل في تحميل قائمة المنتجات');
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
      showToast('تم تحديث المخزون بنجاح', 'success');
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock_quantity: Number(newStock) } : p))
      );
      setStockEditing((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      showToast(err.message || 'فشل تحديث المخزون', 'error');
    } finally {
      setStockSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await adminApi.deleteProduct(deleteModal.product.id);
      showToast('تم حذف المنتج بنجاح', 'success');
      setDeleteModal({ open: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'فشل في حذف المنتج', 'error');
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
        return t;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">إدارة المنتجات والأجهزة</h1>
          <p className="admin-page-subtitle">عرض وإضافة وتعديل الأجهزة ومراقبة المخزون</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إضافة جهاز جديد
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card admin-filter-bar mb-4">
        <form onSubmit={handleSearchSubmit} className="admin-filter-form">
          <div className="filter-item search-item">
            <input
              type="text"
              placeholder="ابحث بالاسم أو الموديل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="filter-item">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="form-control"
            >
              <option value="">جميع الأنواع</option>
              <option value="laptop">لابتوبات</option>
              <option value="phone">هواتف</option>
              <option value="accessory">ملحقات</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="form-control"
            >
              <option value="">جميع الحالات</option>
              <option value="1">معروض للبيع (نشط)</option>
              <option value="0">معطل / غير معروض</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            بحث
          </button>
        </form>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="card">
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" className="mb-2" />
          <Skeleton height="50px" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أجهزة"
          description="لا توجد منتجات تطابق معايير البحث الحالية."
        />
      ) : (
        <div className="card p-0 table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>الصورة</th>
                <th>اسم الجهاز</th>
                <th>النوع / الحالة</th>
                <th>السعر (AED)</th>
                <th>السعر التقديري (SDG)</th>
                <th>المخزون الحالي</th>
                <th>حالة العرض</th>
                <th style={{ width: '130px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isEditingThisStock = stockEditing[p.id] !== undefined;
                return (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={resolveImageUrl(p.primary_image || p.image_path || (p.images && p.images[0]?.thumb_path))}
                        alt={p.name}
                        className="admin-product-thumb"
                        onError={(e) => {
                          e.target.src = '/assets/images/placeholder.svg';
                        }}
                      />
                    </td>
                    <td>
                      <div className="admin-product-name-cell">
                        <Link to={`/products/${p.slug}`} target="_blank" className="admin-product-title">
                          {p.name}
                        </Link>
                        <span className="admin-product-sub">
                          {p.brand_name ? `${p.brand_name} • ` : ''}
                          {p.category_name || ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-secondary">{getTypeLabel(p.type)}</span>
                        <span className="badge badge-outline">{formatCondition(p.condition)}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-navy">
                      {formatAed(p.price_aed)}
                    </td>
                    <td className="font-semibold text-royal">
                      {p.price_sdg ? formatSdg(p.price_sdg) : '—'}
                    </td>
                    <td>
                      {isEditingThisStock ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            value={stockEditing[p.id]}
                            onChange={(e) =>
                              setStockEditing({ ...stockEditing, [p.id]: e.target.value })
                            }
                            className="form-control form-control-sm"
                            style={{ width: '70px', padding: '4px 8px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={stockSaving[p.id]}
                            onClick={() => handleQuickStockSave(p.id)}
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              const copy = { ...stockEditing };
                              delete copy[p.id];
                              setStockEditing(copy);
                            }}
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            className={
                              p.stock_quantity <= 0
                                ? 'text-danger font-bold'
                                : p.stock_quantity <= 2
                                ? 'text-warning font-bold'
                                : 'font-semibold'
                            }
                          >
                            {p.stock_quantity} قطعة
                          </span>
                          <button
                            type="button"
                            className="btn-icon-link"
                            title="تعديل سريع للمخزون"
                            onClick={() =>
                              setStockEditing({ ...stockEditing, [p.id]: p.stock_quantity })
                            }
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {Number(p.is_active) === 1 ? (
                        <Badge variant="success">معروض</Badge>
                      ) : (
                        <Badge variant="warning">غير معروض</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="admin-actions-cell">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="btn btn-sm btn-secondary"
                          title="تعديل الجهاز"
                        >
                          تعديل
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          title="حذف الجهاز"
                          onClick={() => setDeleteModal({ open: true, product: p, loading: false })}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="admin-pagination mt-4">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </button>
          <span className="pagination-info">
            صفحة {meta.page} من {meta.total_pages} (الإجمالي: {meta.total} جهاز)
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= meta.total_pages}
            onClick={() => setPage((prev) => Math.min(meta.total_pages, prev + 1))}
          >
            التالي
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, product: null, loading: false })}
          title="تأكيد حذف الجهاز"
        >
          <div className="p-2">
            <p className="mb-4">
              هل أنت متأكد من رغبتك في حذف الجهاز:
              <br />
              <strong className="text-navy">{deleteModal.product?.name}</strong>؟
            </p>
            <p className="text-muted text-sm mb-4">
              سيتم إزالة الجهاز وصوره من المتجر بشكل نهائي.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteModal.loading}
                onClick={() => setDeleteModal({ open: false, product: null, loading: false })}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteModal.loading}
                onClick={handleDeleteConfirm}
              >
                {deleteModal.loading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
