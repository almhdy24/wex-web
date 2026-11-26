import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Sheet from '../../components/common/Sheet';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import Page from '../../components/common/Page';
import AppBar from '../../components/common/AppBar';
import { Stagger } from '../../motion';
import { pluralAr } from '../../utils/pluralAr';
import styles from './CatalogPage.module.css';

const TYPE_CHIPS = [
  { id: 'all', label: 'الكل' },
  { id: 'laptops', label: 'لابتوبات' },
  { id: 'phones', label: 'هواتف' },
  { id: 'accessories', label: 'ملحقات' },
];

const POPULAR_BRANDS = ['Dell', 'Lenovo', 'HP', 'Apple', 'Acer', 'Asus'];

const CONDITION_OPTIONS = [
  { id: 'all', label: 'الكل' },
  { id: 'new', label: 'جديد' },
  { id: 'used', label: 'مستعمل استيراد' },
];

const PRICE_OPTIONS = [
  { id: 'all', label: 'الكل' },
  { id: 'under-400k', label: 'أقل من 400,000 ج.س' },
  { id: '400k-800k', label: '400,000 - 800,000 ج.س' },
  { id: 'over-800k', label: 'أكثر من 800,000 ج.س' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'الأحدث' },
  { id: 'price-low', label: 'الأقل سعرًا' },
  { id: 'price-high', label: 'الأعلى سعرًا' },
];

export function formatResultsCount(count) {
  if (count === 0) return 'لا توجد نتائج';
  if (count === 1) return 'نتيجة واحدة';
  return pluralAr(count, {
    two: 'نتيجتان',
    few: 'نتائج',
    many: 'نتيجة',
    one: 'نتيجة',
  });
}

export default function CatalogPage({
  initialProducts = null,
  initialLoading = null,
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state as single source of truth
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || 'all';
  // Links from home sections / hero slides (?type=accessory, ?featured=1) were ignored:
  // the catalog showed everything.
  const urlType = searchParams.get('type') || '';
  const urlFeatured = searchParams.get('featured') || '';
  const urlBrand = searchParams.get('brand') || 'all';
  const urlCondition = searchParams.get('condition') || 'all';
  const urlPrice = searchParams.get('price') || 'all';
  const urlSort = searchParams.get('sort') || 'newest';
  const urlPage = Number(searchParams.get('page')) || 1;

  // Local immediate input state for snappy typing
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Bottom Sheet Filter draft state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [draftBrand, setDraftBrand] = useState(urlBrand);
  const [draftCondition, setDraftCondition] = useState(urlCondition);
  const [draftPrice, setDraftPrice] = useState(urlPrice);
  const [draftSort, setDraftSort] = useState(urlSort);

  // Data states
  const [brandsList, setBrandsList] = useState(POPULAR_BRANDS);
  const [products, setProducts] = useState(initialProducts || []);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(initialLoading ?? (initialProducts === null));
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounce search input (300ms) to update URL searchParams
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const currentParam = searchParams.get('search') || searchParams.get('q') || '';
      if (trimmed !== currentParam) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (trimmed) {
            next.set('search', trimmed);
            next.delete('q');
          } else {
            next.delete('search');
            next.delete('q');
          }
          next.delete('page');
          return next;
        }, { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  // Scroll to top of grid when page changes
  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [urlPage]);

  // Fetch brands once
  useEffect(() => {
    let isMounted = true;
    productsApi
      .getBrands()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data || [];
        if (list.length > 0) {
          setBrandsList(list.map((b) => b.name));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products based on URL parameters
  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const params = {
      page: urlPage,
      per_page: 12,
    };

    if (urlSearch.trim()) params.q = urlSearch.trim();
    if (urlCategory !== 'all') params.category = urlCategory;
    if (urlType) params.type = urlType;
    if (urlFeatured) params.featured = urlFeatured;
    if (urlBrand !== 'all') params.brand = urlBrand;
    if (urlCondition !== 'all') params.condition = urlCondition;

    if (urlPrice === 'under-400k') {
      params.max_price_sdg = 400000;
    } else if (urlPrice === '400k-800k') {
      params.min_price_sdg = 400000;
      params.max_price_sdg = 800000;
    } else if (urlPrice === 'over-800k') {
      params.min_price_sdg = 800000;
    }

    if (urlSort === 'price-low') {
      params.sort = 'price_asc';
    } else if (urlSort === 'price-high') {
      params.sort = 'price_desc';
    } else {
      params.sort = 'newest';
    }

    try {
      const res = await productsApi.getProducts(params, { signal: controller.signal });
      setProducts(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 20) return;
      setError(err.message || 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [urlPage, urlSearch, urlCategory, urlType, urlFeatured, urlBrand, urlCondition, urlPrice, urlSort]);

  useEffect(() => {
    if (initialProducts === null) {
      fetchProducts();
    }
  }, [fetchProducts, initialProducts]);

  // Open filter sheet and initialize draft state
  const handleOpenFilterSheet = () => {
    setDraftBrand(urlBrand);
    setDraftCondition(urlCondition);
    setDraftPrice(urlPrice);
    setDraftSort(urlSort);
    setIsFilterSheetOpen(true);
  };

  // Apply filters from bottom sheet directly to URL
  const handleApplySheetFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (draftBrand !== 'all') next.set('brand', draftBrand);
      else next.delete('brand');

      if (draftCondition !== 'all') next.set('condition', draftCondition);
      else next.delete('condition');

      if (draftPrice !== 'all') next.set('price', draftPrice);
      else next.delete('price');

      if (draftSort !== 'newest') next.set('sort', draftSort);
      else next.delete('sort');

      next.delete('page');
      return next;
    });
    setIsFilterSheetOpen(false);
  };

  // Reset filters inside bottom sheet
  const handleResetSheetDraft = () => {
    setDraftBrand('all');
    setDraftCondition('all');
    setDraftPrice('all');
    setDraftSort('newest');
  };

  // Reset all filters
  const handleResetAll = () => {
    setSearchInput('');
    setSearchParams({});
  };

  // Active filter count for badge (brand, condition, price, sort)
  let activeFiltersCount = 0;
  if (urlBrand !== 'all') activeFiltersCount++;
  if (urlCondition !== 'all') activeFiltersCount++;
  if (urlPrice !== 'all') activeFiltersCount++;
  if (urlSort !== 'newest') activeFiltersCount++;

  // Filter sections, shared by the mobile sheet (draft, applied on تطبيق) and the desktop
  // sidebar (applied immediately).
  const renderFilterSections = (f) => (
    <>
    {/* Brand section */}
    <div className={styles.sheetSection}>
      <h3 className={styles.sheetSectionTitle}>الماركة</h3>
      <div className={styles.sheetChipsWrap}>
        <Chip
          selected={f.brand === 'all'}
          onClick={() => f.set.brand('all')}
          size="sm"
        >
          الكل
        </Chip>
        {brandsList.map((brand) => (
          <Chip
            key={brand}
            selected={f.brand === brand}
            onClick={() => f.set.brand(brand)}
            size="sm"
          >
            {brand}
          </Chip>
        ))}
      </div>
    </div>

    {/* Condition section */}
    <div className={styles.sheetSection}>
      <h3 className={styles.sheetSectionTitle}>الحالة</h3>
      <div className={styles.sheetChipsWrap}>
        {CONDITION_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            selected={f.condition === opt.id}
            onClick={() => f.set.condition(opt.id)}
            size="sm"
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>

    {/* Price section */}
    <div className={styles.sheetSection}>
      <h3 className={styles.sheetSectionTitle}>السعر</h3>
      <div className={styles.sheetChipsWrap}>
        {PRICE_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            selected={f.price === opt.id}
            onClick={() => f.set.price(opt.id)}
            size="sm"
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>

    {/* Sort section */}
    <div className={styles.sheetSection}>
      <h3 className={styles.sheetSectionTitle}>الترتيب</h3>
      <div className={styles.sheetChipsWrap}>
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            selected={f.sort === opt.id}
            onClick={() => f.set.sort(opt.id)}
            size="sm"
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>
    </>
  );

  const setLiveFilter = (key, value, fallback) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value !== fallback) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      return next;
    });
  };
  const liveFilters = {
    brand: urlBrand,
    condition: urlCondition,
    price: urlPrice,
    sort: urlSort,
    set: {
      brand: (v) => setLiveFilter('brand', v, 'all'),
      condition: (v) => setLiveFilter('condition', v, 'all'),
      price: (v) => setLiveFilter('price', v, 'all'),
      sort: (v) => setLiveFilter('sort', v, 'newest'),
    },
  };

  const totalResults = meta?.total !== undefined ? meta.total : products.length;

  return (
    <div className={styles.pageWrapper}>
      <AppBar
        tone="navy"
        overlap={62}
        title="الأجهزة"
        showBack={true}
        backTo="/"
        showCart={true}
      />

      <Page padded={false} className={styles.container}>
      <div className={styles.layout}>
      {/* Desktop filter sidebar (the mobile sheet's sections, applied immediately) */}
      <aside className={styles.sidebar} aria-label="تصفية الأجهزة">
        <div className={styles.sidebarHead}>
          <h2 className={styles.sidebarTitle}>تصفية</h2>
          {activeFiltersCount > 0 && (
            <button type="button" onClick={handleResetAll} className={styles.resetInlineBtn}>
              <RotateCcw size={14} aria-hidden="true" />
              <span>مسح الكل</span>
            </button>
          )}
        </div>
        {renderFilterSections(liveFilters)}
      </aside>

      <div className={styles.main}>
        {/* Search Field */}
      <div className={styles.searchContainer}>
        <Search size={22} strokeWidth={2} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث عن جهاز أو ماركة"
          className={styles.searchInput}
          aria-label="ابحث عن جهاز أو ماركة"
          enterKeyHint="search"
          dir="auto"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            className={styles.searchClearBtn}
            aria-label="مسح البحث"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Controls Bar: Type Chips Row + Filter Button */}
      <div className={styles.controlsBar}>
        <div className={styles.typeChipsRow} role="tablist" aria-label="نوع الأجهزة">
          {TYPE_CHIPS.map((chip) => (
            <Chip
              key={chip.id}
              selected={urlCategory === chip.id}
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (chip.id !== 'all') {
                    next.set('category', chip.id);
                  } else {
                    next.delete('category');
                  }
                  next.delete('type');
                  next.delete('featured');
                  next.delete('page');
                  return next;
                });
              }}
              size="sm"
            >
              {chip.label}
            </Chip>
          ))}
        </div>

        <button
          type="button"
          onClick={handleOpenFilterSheet}
          className={`${styles.filterButton} ${activeFiltersCount > 0 ? styles.filterButtonActive : ''}`}
          aria-label="تصفية"
        >
          <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>تصفية</span>
          {activeFiltersCount > 0 && (
            <span className={styles.filterBadge}>{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Result Count Bar */}
      <div className={styles.resultBar}>
        <span className={styles.resultCount} aria-live="polite">
          {formatResultsCount(totalResults)}
        </span>
        {(activeFiltersCount > 0 || urlCategory !== 'all' || urlType || urlFeatured || urlSearch.trim()) && (
          <button
            type="button"
            onClick={handleResetAll}
            className={styles.resetInlineBtn}
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>مسح التصفية</span>
          </button>
        )}
      </div>

      {/* Product Grid / Empty State */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="لا توجد أجهزة مطابقة. جرّب تغيير التصفية."
          action={
            <Button variant="secondary" onClick={handleResetAll}>
              مسح التصفية
            </Button>
          }
        />
      ) : (
        <Stagger className={styles.grid}>
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </Stagger>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="secondary"
            size="sm"
            disabled={urlPage <= 1}
            onClick={() => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('page', Math.max(1, urlPage - 1));
                return next;
              });
            }}
          >
            السابق
          </Button>
          <span className={styles.pageNumber}>
            {urlPage} / {meta.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={urlPage >= meta.last_page}
            onClick={() => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('page', Math.min(meta.last_page, urlPage + 1));
                return next;
              });
            }}
          >
            التالي
          </Button>
        </div>
      )}

      </div>
      </div>

      {/* Filter Bottom Sheet */}
      <Sheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="تصفية"
      >
        <div className={styles.sheetContent}>
          {renderFilterSections({ brand: draftBrand, condition: draftCondition, price: draftPrice, sort: draftSort, set: { brand: setDraftBrand, condition: setDraftCondition, price: setDraftPrice, sort: setDraftSort } })}

          {/* Actions */}
          <div className={styles.sheetActions}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleApplySheetFilters}
              className={styles.applyBtn}
            >
              تطبيق
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleResetSheetDraft}
              className={styles.resetDraftBtn}
            >
              مسح
            </Button>
          </div>
        </div>
      </Sheet>
    </Page>
    </div>
  );
}
