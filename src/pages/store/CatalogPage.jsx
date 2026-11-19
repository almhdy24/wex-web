import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Sheet from '../../components/common/Sheet';
import styles from './CatalogPage.module.css';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL params
  const [q, setQ] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');
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

  // Load categories and brands
  useEffect(() => {
    let isMounted = true;
    Promise.all([productsApi.getCategories(), productsApi.getBrands()])
      .then(([catsRes, brandsRes]) => {
        if (!isMounted) return;
        setCategoriesList(catsRes?.data || []);
        setBrandsList(brandsRes?.data || []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
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
    if (minPrice) params.min_price_aed = minPrice;
    if (maxPrice) params.max_price_aed = maxPrice;

    // Sync clean params to URL
    const cleanUrlParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (
        v !== '' &&
        v !== null &&
        v !== undefined &&
        !(k === 'page' && v === 1) &&
        !(k === 'sort' && v === 'newest') &&
        k !== 'per_page'
      ) {
        cleanUrlParams[k] = v;
      }
    });
    setSearchParams(cleanUrlParams, { replace: true });

    try {
      const res = await productsApi.getProducts(params);
      setProducts(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message || 'الاتصال ضعيف. حاول تاني.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, q, category, brand, type, condition, inStock, minPrice, maxPrice, setSearchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilters = () => {
    setQ('');
    setCategory('');
    setBrand('');
    setType('');
    setCondition('');
    setInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
    setSearchParams({}, { replace: true });
    setMobileFilterOpen(false);
  };

  const hasActiveFilters = Boolean(
    q || category || brand || type || condition || inStock || minPrice || maxPrice
  );

  const filterFormContent = (
    <>
      <form onSubmit={handleSearchSubmit}>
        <Input
          label="البحث"
          placeholder="ابحث بالاسم أو المواصفات..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          hint="اضغط Enter للبحث"
        />
      </form>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="filter-type">نوع الجهاز</label>
        <Select
          id="filter-type"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'كل الأنواع' },
            { value: 'laptop', label: 'لابتوب' },
            { value: 'phone', label: 'هاتف' },
            { value: 'accessory', label: 'ملحقات' },
          ]}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="filter-category">التصنيف</label>
        <Select
          id="filter-category"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'كل التصنيفات' },
            ...categoriesList.map((c) => ({ value: c.slug, label: c.name_ar })),
          ]}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="filter-brand">الماركة</label>
        <Select
          id="filter-brand"
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'كل الماركات' },
            ...brandsList.map((b) => ({ value: b.slug, label: b.name })),
          ]}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="filter-condition">الحالة</label>
        <Select
          id="filter-condition"
          value={condition}
          onChange={(e) => { setCondition(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'كل الحالات' },
            { value: 'used_imported', label: 'مستعمل استيراد' },
            { value: 'new', label: 'جديد' },
          ]}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>نطاق السعر بالدرهم</label>
        <div className={styles.priceInputs}>
          <input
            type="number"
            placeholder="من"
            className={styles.priceInput}
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            aria-label="أدنى سعر بالدرهم"
          />
          <input
            type="number"
            placeholder="إلى"
            className={styles.priceInput}
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            aria-label="أقصى سعر بالدرهم"
          />
        </div>
      </div>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={inStock}
          onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
        />
        <span>المتوفر بالمخزن فقط</span>
      </label>
    </>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.pageTitle}>المتجر</h1>
          <p className={styles.totalCount}>
            {meta?.total !== undefined ? `${meta.total} جهاز متاح` : 'تصفح كافة الأجهزة والمواصفات'}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className={styles.filterToggleBtn}
          >
            <SlidersHorizontal size={16} />
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
            className={styles.sortSelect}
            aria-label="ترتيب النتائج"
          />
        </div>
      </header>

      <div className={styles.layoutGrid}>
        {/* Desktop Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <h2 className={styles.filterTitle}>تصفية النتائج</h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className={styles.clearFiltersBtn}
                >
                  مسح الفلاتر
                </button>
              )}
            </div>

            {filterFormContent}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className={styles.mainContent}>
          {error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : loading ? (
            <div className={styles.productGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="ما لقينا أجهزة بالمواصفات دي"
              description="جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر لعرض الأجهزة الأخرى المتوفرة."
              actionLabel="مسح الفلاتر"
              onAction={handleClearFilters}
            />
          ) : (
            <>
              <div className={styles.productGrid}>
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {meta && meta.total_pages > 1 && (
                <nav className={styles.pagination} aria-label="تنقل الصفحات">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((p) => p - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <ArrowRight size={16} />
                    <span>السابق</span>
                  </Button>

                  <span className={styles.pageIndicator}>
                    صفحة {meta.page} من {meta.total_pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.total_pages}
                    onClick={() => {
                      setPage((p) => p + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span>التالي</span>
                    <ArrowLeft size={16} />
                  </Button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="تصفية النتائج"
      >
        <div className={styles.sheetFilters}>
          {filterFormContent}
          <div className={styles.sheetActions}>
            <Button
              variant="primary"
              block
              onClick={() => setMobileFilterOpen(false)}
            >
              عرض النتائج
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
              >
                مسح
              </Button>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
