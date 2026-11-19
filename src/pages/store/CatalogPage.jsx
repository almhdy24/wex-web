import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL params
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price_aed') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price_aed') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Metadata
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load filter options (categories and brands)
  useEffect(() => {
    let isMounted = true;
    Promise.all([productsApi.getCategories(), productsApi.getBrands()])
      .then(([catsRes, brandsRes]) => {
        if (!isMounted) return;
        setCategoriesList(catsRes?.data || []);
        setBrandsList(brandsRes?.data || []);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Fetch products matching current filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      page,
      per_page: 12,
      sort,
    };
    if (q.trim()) params.q = q.trim();
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (type) params.type = type;
    if (condition) params.condition = condition;
    if (inStock) params.in_stock = 'true';
    if (featured) params.featured = 'true';
    if (minPrice) params.min_price_aed = minPrice;
    if (maxPrice) params.max_price_aed = maxPrice;

    // Sync to URL
    const cleanUrlParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && !(k === 'page' && v === 1) && !(k === 'sort' && v === 'newest') && !(k === 'per_page')) {
        cleanUrlParams[k] = v;
      }
    });
    setSearchParams(cleanUrlParams, { replace: true });

    try {
      const res = await productsApi.getProducts(params);
      setProducts(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message || 'فشل تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [page, sort, q, category, brand, type, condition, inStock, featured, minPrice, maxPrice, setSearchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleClearFilters = () => {
    setQ('');
    setCategory('');
    setBrand('');
    setType('');
    setCondition('');
    setInStock(false);
    setFeatured(false);
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(
    q || category || brand || type || condition || inStock || featured || minPrice || maxPrice || sort !== 'newest'
  );

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
      {/* Page Title & Mobile Filter Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>كتالوج الأجهزة والمنتجات</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            {meta?.total !== undefined ? `إجمالي الأجهزة المتاحة: ${meta.total}` : 'تصفح كافة الأجهزة والمواصفات'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="mobile-filter-btn"
          >
            <span>⚙️</span>
            <span>الفلاتر {hasActiveFilters ? '●' : ''}</span>
          </Button>

          <Select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            options={[
              { value: 'newest', label: 'الأحدث أولاً' },
              { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
              { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
            ]}
            style={{ width: 190, marginBottom: 0 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-6)' }}>
        {/* Sidebar Filters */}
        <aside
          className={`catalog-filter-sidebar ${mobileFilterOpen ? 'is-open' : ''}`}
          style={{
            gridColumn: 'span 3',
          }}
        >
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>تصفية النتائج</h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                >
                  مسح الفلاتر
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <form onSubmit={handleSearchSubmit} style={{ marginBottom: 'var(--space-4)' }}>
              <Input
                label="بحث بالاسم أو المعالج"
                placeholder="مثال: Dell, Core i7, SSD..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                hint="اضغط Enter للتطبيق"
              />
            </form>

            {/* Product Type Filter */}
            <div className="form-group">
              <label className="form-label">نوع الجهاز</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
              >
                <option value="">جميع الأنواع</option>
                <option value="laptop">لابتوب</option>
                <option value="phone">هاتف ذكي</option>
                <option value="accessory">ملحقات وإكسسوارات</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="form-group">
              <label className="form-label">التصنيف</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              >
                <option value="">جميع التصنيفات</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="form-group">
              <label className="form-label">الماركة</label>
              <select
                className="form-select"
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setPage(1); }}
              >
                <option value="">جميع الماركات</option>
                {brandsList.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="form-group">
              <label className="form-label">الحالة</label>
              <select
                className="form-select"
                value={condition}
                onChange={(e) => { setCondition(e.target.value); setPage(1); }}
              >
                <option value="">جميع الحالات</option>
                <option value="used_imported">وارد دبي (مستعمل أصلي)</option>
                <option value="new">جديد بالكرتونة</option>
              </select>
            </div>

            {/* Price Range (in AED) */}
            <div className="form-group">
              <label className="form-label">نطاق السعر بالدرهم (د.إ)</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  type="number"
                  placeholder="من"
                  className="form-input"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  dir="ltr"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  className="form-input"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                  style={{ accentColor: 'var(--color-royal-blue)' }}
                />
                <span>الأجهزة المتوفرة فقط</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => { setFeatured(e.target.checked); setPage(1); }}
                  style={{ accentColor: 'var(--color-royal-blue)' }}
                />
                <span>الأجهزة المميزة فقط</span>
              </label>
            </div>

            {/* Mobile Close Button */}
            <div style={{ marginTop: 'var(--space-5)' }} className="mobile-close-filter-wrapper">
              <Button
                variant="primary"
                block
                size="sm"
                onClick={() => setMobileFilterOpen(false)}
              >
                تطبيق الفلاتر وعرض النتائج
              </Button>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main style={{ gridColumn: 'span 9' }} className="catalog-main-content">
          {error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'var(--space-5)',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="لم يتم العثور على أجهزة مطابقة"
              description="جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر لعرض الأجهزة الأخرى المتوفرة."
              actionLabel="إعادة ضبط الفلاتر"
              onAction={handleClearFilters}
            />
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 'var(--space-5)',
                }}
              >
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination Controls */}
              {meta && meta.total_pages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-8)',
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    السابق
                  </Button>

                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-600)', margin: '0 var(--space-2)' }}>
                    صفحة {meta.page} من {meta.total_pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.total_pages}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    التالي
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .catalog-filter-sidebar {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
            padding: var(--space-4);
          }
          .catalog-filter-sidebar.is-open {
            display: block !important;
          }
          .catalog-filter-sidebar .card {
            max-width: 440px;
            margin: auto;
          }
          .catalog-main-content {
            grid-column: 1 / -1 !important;
          }
        }
        @media (min-width: 901px) {
          .mobile-filter-btn {
            display: none !important;
          }
          .mobile-close-filter-wrapper {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
