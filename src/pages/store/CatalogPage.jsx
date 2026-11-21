import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import Sheet from '../../components/common/Sheet';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
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

  // URL state
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlBrand = searchParams.get('brand') || 'all';
  const urlCondition = searchParams.get('condition') || 'all';
  const urlPrice = searchParams.get('price') || 'all';
  const urlSort = searchParams.get('sort') || 'newest';
  const urlPage = Number(searchParams.get('page')) || 1;

  // Active filters
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedType, setSelectedType] = useState(urlCategory);
  const [selectedBrand, setSelectedBrand] = useState(urlBrand);
  const [selectedCondition, setSelectedCondition] = useState(urlCondition);
  const [selectedPrice, setSelectedPrice] = useState(urlPrice);
  const [selectedSort, setSelectedSort] = useState(urlSort);
  const [currentPage, setCurrentPage] = useState(urlPage);

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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      per_page: 12,
    };

    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedType !== 'all') params.category = selectedType;
    if (selectedBrand !== 'all') params.brand = selectedBrand;
    if (selectedCondition !== 'all') params.condition = selectedCondition;

    if (selectedPrice === 'under-400k') {
      params.max_price_sdg = 400000;
    } else if (selectedPrice === '400k-800k') {
      params.min_price_sdg = 400000;
      params.max_price_sdg = 800000;
    } else if (selectedPrice === 'over-800k') {
      params.min_price_sdg = 800000;
    }

    if (selectedSort === 'price-low') {
      params.sort = 'price_asc';
    } else if (selectedSort === 'price-high') {
      params.sort = 'price_desc';
    } else {
      params.sort = 'newest';
    }

    // Sync URL params
    const nextParams = {};
    if (searchQuery.trim()) nextParams.search = searchQuery.trim();
    if (selectedType !== 'all') nextParams.category = selectedType;
    if (selectedBrand !== 'all') nextParams.brand = selectedBrand;
    if (selectedCondition !== 'all') nextParams.condition = selectedCondition;
    if (selectedPrice !== 'all') nextParams.price = selectedPrice;
    if (selectedSort !== 'newest') nextParams.sort = selectedSort;
    if (currentPage > 1) nextParams.page = currentPage;

    setSearchParams(nextParams, { replace: true });

    try {
      const res = await productsApi.getProducts(params);
      setProducts(res?.data || []);
      setMeta(res?.meta || null);
    } catch (err) {
      setError(err.message || 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchQuery,
    selectedType,
    selectedBrand,
    selectedCondition,
    selectedPrice,
    selectedSort,
    setSearchParams,
  ]);

  useEffect(() => {
    if (initialProducts === null) {
      fetchProducts();
    }
  }, [fetchProducts, initialProducts]);

  // Open filter sheet and initialize draft state
  const handleOpenFilterSheet = () => {
    setDraftBrand(selectedBrand);
    setDraftCondition(selectedCondition);
    setDraftPrice(selectedPrice);
    setDraftSort(selectedSort);
    setIsFilterSheetOpen(true);
  };

  // Apply filters from bottom sheet
  const handleApplySheetFilters = () => {
    setSelectedBrand(draftBrand);
    setSelectedCondition(draftCondition);
    setSelectedPrice(draftPrice);
    setSelectedSort(draftSort);
    setCurrentPage(1);
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
    setSearchQuery('');
    setSelectedType('all');
    setSelectedBrand('all');
    setSelectedCondition('all');
    setSelectedPrice('all');
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  // Active filter count for badge (brand, condition, price, sort)
  let activeFiltersCount = 0;
  if (selectedBrand !== 'all') activeFiltersCount++;
  if (selectedCondition !== 'all') activeFiltersCount++;
  if (selectedPrice !== 'all') activeFiltersCount++;
  if (selectedSort !== 'newest') activeFiltersCount++;

  const totalResults = meta?.total !== undefined ? meta.total : products.length;

  return (
    <div className={styles.container}>
      {/* Title */}
      <header className={styles.header}>
        <h1 className={styles.title}>الأجهزة</h1>
      </header>

      {/* Search Field */}
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ابحث عن جهاز أو ماركة"
            className={styles.searchInput}
            aria-label="ابحث عن جهاز أو ماركة"
          />
        </div>
      </div>

      {/* Controls Bar: Type Chips Row + Filter Button */}
      <div className={styles.controlsBar}>
        <div className={styles.typeChipsRow} role="tablist" aria-label="نوع الأجهزة">
          {TYPE_CHIPS.map((chip) => (
            <Chip
              key={chip.id}
              selected={selectedType === chip.id}
              onClick={() => {
                setSelectedType(chip.id);
                setCurrentPage(1);
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
        <span className={styles.resultCount}>
          {formatResultsCount(totalResults)}
        </span>
        {(activeFiltersCount > 0 || selectedType !== 'all' || searchQuery.trim()) && (
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
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button variant="secondary" onClick={fetchProducts}>
            إعادة المحاولة
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>لا توجد أجهزة مطابقة. جرّب تغيير التصفية.</p>
          <Button variant="secondary" onClick={handleResetAll}>
            مسح التصفية
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </Button>
          <span className={styles.pageNumber}>
            {currentPage} / {meta.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= meta.last_page}
            onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Filter Bottom Sheet */}
      <Sheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="تصفية"
      >
        <div className={styles.sheetContent}>
          {/* Brand section */}
          <div className={styles.sheetSection}>
            <h3 className={styles.sheetSectionTitle}>الماركة</h3>
            <div className={styles.sheetChipsWrap}>
              <Chip
                selected={draftBrand === 'all'}
                onClick={() => setDraftBrand('all')}
                size="sm"
              >
                الكل
              </Chip>
              {brandsList.map((brand) => (
                <Chip
                  key={brand}
                  selected={draftBrand === brand}
                  onClick={() => setDraftBrand(brand)}
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
                  selected={draftCondition === opt.id}
                  onClick={() => setDraftCondition(opt.id)}
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
                  selected={draftPrice === opt.id}
                  onClick={() => setDraftPrice(opt.id)}
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
                  selected={draftSort === opt.id}
                  onClick={() => setDraftSort(opt.id)}
                  size="sm"
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.sheetActions}>
            <Button
              variant="primary"
              onClick={handleApplySheetFilters}
              className={styles.applyBtn}
            >
              تطبيق
            </Button>
            <Button
              variant="secondary"
              onClick={handleResetSheetDraft}
              className={styles.resetDraftBtn}
            >
              مسح
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
