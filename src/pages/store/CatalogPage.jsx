import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
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
  const [pricePreset, setPricePreset] = useState(searchParams.get('price') || 'all');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('in_stock') === '1');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
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
    if (inStockOnly) params.in_stock = 1;

    // Price preset mapping (SDG only)
    if (pricePreset === 'under-400k') {
      params.max_price = 400000;
    } else if (pricePreset === '400k-800k') {
      params.min_price = 400000;
      params.max_price = 800000;
    } else if (pricePreset === 'over-800k') {
      params.min_price = 800000;
    }

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
    if (pricePreset !== 'all') urlParams.price = pricePreset;
    if (inStockOnly) urlParams.in_stock = '1';
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
  }, [
    currentPage,
    query,
    selectedCategory,
    selectedBrand,
    selectedCondition,
    pricePreset,
    inStockOnly,
    selectedSort,
    setSearchParams,
  ]);

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
    setPricePreset('all');
    setInStockOnly(false);
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  const totalCount = meta?.total || products.length;
  const hasActiveFilters = Boolean(
    query.trim() ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedCondition !== 'all' ||
    pricePreset !== 'all' ||
    inStockOnly
  );

  return (
    <div className={styles.container}>
      {/* Mobile/Tablet In-Catalog Search Bar (hidden on desktop where top header search lives) */}
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

      {/* Mobile/Tablet Filter Bar 1: Categories & Conditions */}
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

      {/* Mobile/Tablet Filter Bar 2: Brands & Sort Dropdown */}
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

      {/* Main 2-Column Catalog Container (Sidebar + Results) */}
      <div className={styles.catalogLayout}>
        {/* Desktop Sticky Filter Sidebar */}
        <aside className={styles.desktopSidebar} aria-label="تصفية الأجهزة">
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleRow}>
                <Filter size={18} className={styles.filterIcon} />
                <h3 className={styles.sidebarTitle}>تصفية الأجهزة</h3>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={styles.sidebarResetBtn}
                  title={t('catalog.resetFilters')}
                >
                  <RotateCcw size={12} />
                  <span>مسح الكل</span>
                </button>
              )}
            </div>

            {/* Filter Section: Categories */}
            <div className={styles.filterGroup}>
              <h4 className={styles.groupHeading}>نوع الجهاز</h4>
              <div className={styles.groupOptions}>
                <button
                  type="button"
                  className={`${styles.sidebarChip} ${selectedCategory === 'all' ? styles.sidebarChipActive : ''}`}
                  onClick={() => handleCategorySelect('all')}
                >
                  الكل
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.sidebarChip} ${selectedCategory === cat.slug ? styles.sidebarChipActive : ''}`}
                    onClick={() => handleCategorySelect(cat.slug)}
                  >
                    {cat.name_ar || cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Condition */}
            <div className={styles.filterGroup}>
              <h4 className={styles.groupHeading}>حالة الجهاز</h4>
              <div className={styles.groupOptions}>
                <button
                  type="button"
                  className={`${styles.sidebarChip} ${selectedCondition === 'all' ? styles.sidebarChipActive : ''}`}
                  onClick={() => { setSelectedCondition('all'); setCurrentPage(1); }}
                >
                  الكل
                </button>
                <button
                  type="button"
                  className={`${styles.sidebarChip} ${selectedCondition === 'new' ? styles.sidebarChipActive : ''}`}
                  onClick={() => { setSelectedCondition('new'); setCurrentPage(1); }}
                >
                  {t('home.categories.conditionNew')}
                </button>
                <button
                  type="button"
                  className={`${styles.sidebarChip} ${selectedCondition === 'used' ? styles.sidebarChipActive : ''}`}
                  onClick={() => { setSelectedCondition('used'); setCurrentPage(1); }}
                >
                  {t('home.categories.conditionUsed')}
                </button>
              </div>
            </div>

            {/* Filter Section: Brands */}
            <div className={styles.filterGroup}>
              <h4 className={styles.groupHeading}>الماركة</h4>
              <div className={styles.brandOptionsList}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="radio"
                    name="brand-filter"
                    checked={selectedBrand === 'all'}
                    onChange={() => handleBrandSelect('all')}
                    className={styles.radioInput}
                  />
                  <span>كل الماركات</span>
                </label>
                {brandsList.map((brand) => (
                  <label key={brand} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="brand-filter"
                      checked={selectedBrand === brand}
                      onChange={() => handleBrandSelect(brand)}
                      className={styles.radioInput}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Section: Price Presets (SDG tabular) */}
            <div className={styles.filterGroup}>
              <h4 className={styles.groupHeading}>نطاق السعر (ج.س)</h4>
              <div className={styles.groupOptions}>
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'under-400k', label: 'أقل من 400,000 ج.س' },
                  { id: '400k-800k', label: '400,000 — 800,000 ج.س' },
                  { id: 'over-800k', label: 'أكثر من 800,000 ج.س' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.sidebarChip} ${pricePreset === preset.id ? styles.sidebarChipActive : ''}`}
                    onClick={() => { setPricePreset(preset.id); setCurrentPage(1); }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: In-Stock Toggle */}
            <div className={styles.filterGroup}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => { setInStockOnly(e.target.checked); setCurrentPage(1); }}
                  className={styles.checkboxInput}
                />
                <span className={styles.toggleText}>الأجهزة المتوفرة فقط</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Results Column */}
        <section className={styles.resultsColumn} aria-label="قائمة الأجهزة">
          {/* Desktop Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.resultsCount}>
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <span>{t('catalog.resultsCount', { count: totalCount })}</span>
              )}
            </div>

            <div className={styles.toolbarControls}>
              {/* Grid / List View Toggle */}
              <div className={styles.viewToggleGroup}>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="عرض شبكي"
                  title="عرض شبكي"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="عرض قائمة"
                  title="عرض قائمة"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={selectedSort}
                onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
                className={styles.toolbarSortSelect}
                aria-label={t('catalog.sortTitle')}
              >
                <option value="newest">{t('catalog.sortNewest')}</option>
                <option value="price-low">{t('catalog.sortPriceAsc')}</option>
                <option value="price-high">{t('catalog.sortPriceDesc')}</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={styles.mobileResetBtn}
                >
                  <RotateCcw size={12} />
                  <span>{t('catalog.resetFilters')}</span>
                </button>
              )}
            </div>
          </div>

          {error && <ErrorState message={error} onRetry={loadProducts} />}

          {/* Product Grid / List */}
          <div className={viewMode === 'list' ? styles.productList : styles.productGrid}>
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

          {/* Pagination */}
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
        </section>
      </div>
    </div>
  );
}
