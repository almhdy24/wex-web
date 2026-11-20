import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { t } from '../../content/ar';
import styles from './CatalogPage.module.css';

const POPULAR_BRANDS = ['Dell', 'Lenovo', 'HP', 'Apple', 'Acer', 'Asus'];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active filters initialized from URL
  const [query, setQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'all');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'all');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Data states
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch metadata once
  useEffect(() => {
    let isMounted = true;
    Promise.all([productsApi.getCategories(), productsApi.getBrands()])
      .then(([catsRes, brandsRes]) => {
        if (!isMounted) return;
        setCategoriesList(catsRes?.data || []);
        const bList = brandsRes?.data || [];
        setBrandsList(bList.length > 0 ? bList.map((b) => b.name) : POPULAR_BRANDS);
      })
      .catch(() => {
        if (isMounted) setBrandsList(POPULAR_BRANDS);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products matching filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      per_page: 12,
    };

    if (query.trim()) params.q = query.trim();
    if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedBrand && selectedBrand !== 'all') params.brand = selectedBrand;
    if (selectedCondition && selectedCondition !== 'all') params.condition = selectedCondition;

    if (selectedSort === 'price-low') {
      params.sort = 'price_asc';
    } else if (selectedSort === 'price-high') {
      params.sort = 'price_desc';
    } else {
      params.sort = 'newest';
    }

    // Keep URL in sync
    const urlParams = {};
    if (query.trim()) urlParams.search = query.trim();
    if (selectedCategory && selectedCategory !== 'all') urlParams.category = selectedCategory;
    if (selectedBrand && selectedBrand !== 'all') urlParams.brand = selectedBrand;
    if (selectedCondition && selectedCondition !== 'all') urlParams.condition = selectedCondition;
    if (selectedSort !== 'newest') urlParams.sort = selectedSort;
    if (currentPage > 1) urlParams.page = currentPage;

    setSearchParams(urlParams, { replace: true });

    try {
      const res = await productsApi.getProducts(params);
      setProducts(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message || 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [currentPage, query, selectedCategory, selectedBrand, selectedCondition, selectedSort, setSearchParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
  };

  const handleBrandSelect = (brandName) => {
    setSelectedBrand(brandName);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedCondition('all');
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  const totalCount = meta?.total || products.length;
  const hasActiveFilters = Boolean(
    query.trim() ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedCondition !== 'all'
  );

  return (
    <div className={styles.container}>
      {/* 1. In-Catalog Search Bar */}
      <section className={styles.searchSection} aria-label={t('catalog.searchPlaceholder')}>
        <div className={styles.searchForm}>
          <input
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder={t('catalog.searchPlaceholder')}
            className={styles.searchInput}
            aria-label={t('catalog.searchPlaceholder')}
          />
          <Search size={16} className={styles.searchIcon} />
        </div>
      </section>

      {/* 2. Filter Bar 1: Categories & Conditions */}
      <section className={styles.filterScrollSection} aria-label="تصنيفات الأجهزة">
        <div className={styles.filterChipsScroll}>
          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategory === 'all' && selectedCondition === 'all' ? styles.active : ''}`}
            onClick={() => { setSelectedCategory('all'); setSelectedCondition('all'); setCurrentPage(1); }}
          >
            الكل
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${selectedCondition === 'new' ? styles.active : ''}`}
            onClick={() => { setSelectedCondition(selectedCondition === 'new' ? 'all' : 'new'); setCurrentPage(1); }}
          >
            {t('home.categories.conditionNew')}
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${selectedCondition === 'used' ? styles.active : ''}`}
            onClick={() => { setSelectedCondition(selectedCondition === 'used' ? 'all' : 'used'); setCurrentPage(1); }}
          >
            {t('home.categories.conditionUsed')}
          </button>

          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.filterChip} ${selectedCategory === cat.slug ? styles.active : ''}`}
              onClick={() => handleCategorySelect(cat.slug)}
            >
              {cat.name_ar || cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Filter Bar 2: Brands & Compact Sort Dropdown */}
      <section className={styles.brandSortSection} aria-label="الماركات والترتيب">
        <div className={styles.filterChipsScroll}>
          <button
            type="button"
            className={`${styles.filterChip} ${selectedBrand === 'all' ? styles.active : ''}`}
            onClick={() => handleBrandSelect('all')}
          >
            كل الماركات
          </button>

          {brandsList.map((brand) => (
            <button
              key={brand}
              type="button"
              className={`${styles.filterChip} ${selectedBrand === brand ? styles.active : ''}`}
              onClick={() => handleBrandSelect(brand)}
            >
              {brand}
            </button>
          ))}
        </div>

        <select
          value={selectedSort}
          onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
          className={styles.sortSelect}
          aria-label={t('catalog.sortTitle')}
        >
          <option value="newest">{t('catalog.sortNewest')}</option>
          <option value="price-low">{t('catalog.sortPriceAsc')}</option>
          <option value="price-high">{t('catalog.sortPriceDesc')}</option>
        </select>
      </section>

      {/* Results Header Count & Reset */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          {loading ? 'جاري التحميل...' : t('catalog.resultsCount', { count: totalCount })}
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={handleResetFilters} className={styles.resetBtn}>
            <RotateCcw size={12} />
            <span>{t('catalog.resetFilters')}</span>
          </button>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={loadProducts} />}

      {/* 4. Live 2-Column Product Grid with Staggered Fade-in */}
      <div className={styles.productGrid}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
        ) : products.length > 0 ? (
          products.map((prod, idx) => (
            <ProductCard key={prod.id} product={prod} index={idx} />
          ))
        ) : !error ? (
          <div className={styles.emptyContainer}>
            <EmptyState
              title={t('catalog.noResultsTitle')}
              description={t('catalog.noResultsDesc')}
              actionLabel={t('catalog.resetFilters')}
              onAction={handleResetFilters}
            />
          </div>
        ) : null}
      </div>

      {/* 5. Pagination Bar */}
      {meta && meta.last_page > 1 && (
        <nav className={styles.pagination} aria-label="صفحات المنتجات">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={styles.pageBtn}
          >
            <ArrowRight size={16} />
            <span>السابق</span>
          </button>

          <span className={styles.pageInfo}>
            صفحة {currentPage} من {meta.last_page}
          </span>

          <button
            type="button"
            disabled={currentPage >= meta.last_page}
            onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
            className={styles.pageBtn}
          >
            <span>التالي</span>
            <ArrowLeft size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
