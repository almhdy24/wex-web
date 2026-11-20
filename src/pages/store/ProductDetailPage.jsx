import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  ShieldCheck,
  MapPin,
  Check,
  Maximize2,
  X,
  Share2,
  GitCompare,
  Heart,
  Truck,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import PriceNotice from '../../components/common/PriceNotice';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { t } from '../../content/ar';
import LaptopSvg from '../../components/common/LaptopSvg';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import ProductCard from '../../components/products/ProductCard';
import styles from './ProductDetailPage.module.css';

const RECENTLY_VIEWED_KEY = 'wex_recently_viewed';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { success } = useToast();

  const [product, setProduct] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [relatedAccessories, setRelatedAccessories] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'warranty'
  const heroImgRef = useRef(null);

  // Load product data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setImageError(false);
    setSelectedImageIndex(0);

    Promise.all([
      productsApi.getProductDetail(slug),
      productsApi.getShopInfo().catch(() => ({ data: null })),
      productsApi.getProducts({ category: 'accessories', per_page: 4 }).catch(() => ({ data: [] })),
    ])
      .then(([prodRes, shopRes, accessRes]) => {
        if (!isMounted) return;
        const data = prodRes.data;
        setProduct(data);
        setShopInfo(shopRes?.data || null);
        const accessList = accessRes?.data || [];
        setRelatedAccessories(accessList.filter((a) => a.id !== data.id).slice(0, 4));

        // Save to recently viewed
        saveToRecentlyViewed(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'تعذر العثور على الجهاز المطلوب');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Load existing recently viewed
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setRecentlyViewed(parsed.filter((p) => p.slug !== slug && String(p.id) !== String(slug)).slice(0, 4));
      }
    } catch {
      // Storage unavailable
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!product) return;
      const imagesList = (product.images && product.images.length > 0)
        ? product.images
        : (product.image ? [product.image] : []);
      if (imagesList.length <= 1) return;

      if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev + 1) % imagesList.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  const saveToRecentlyViewed = (prod) => {
    if (!prod || !prod.id) return;
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((p) => p.id !== prod.id);
      const updated = [
        {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          price_sdg: prod.price_sdg,
          image: prod.image,
          brand: prod.brand,
          condition: prod.condition,
        },
        ...filtered,
      ].slice(0, 8);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="280px" borderRadius="var(--radius-xl)" />
        <Skeleton width="80%" height="28px" />
        <Skeleton width="40%" height="20px" />
        <Skeleton height="110px" borderRadius="var(--radius-lg)" />
        <Skeleton height="180px" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.container}>
        <ErrorState
          title={t('catalog.noResultsTitle')}
          message={error || 'لم نتمكن من العثور على الجهاز المطلوب في المتجر.'}
          onRetry={() => navigate('/products')}
        />
      </div>
    );
  }

  const condition = getConditionLabel(product.condition);
  const isOutOfStock =
    product.stock_status === 'out_of_stock' ||
    (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const priceLockHours = shopInfo?.lock_hours || shopInfo?.price_lock_hours || 4;
  const inCompare = isInCompare(product.id);
  const inFav = isFavorite(product.id);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : []);
  const activeImageObj = images[selectedImageIndex] || null;
  const displayImage = activeImageObj ? getProductImageUrl(activeImageObj.path || activeImageObj) : null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setIsAdded(true);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignore haptics
      }
    }

    success(t('cart.addedItemSuccess', { name: product.name }) || `تمت إضافة "${product.name}" إلى السلة`);

    // WAAPI Fly-to-Cart animation
    if (typeof window !== 'undefined' && heroImgRef.current) {
      const cartBtn = document.getElementById('app-bar-cart-btn');
      const isReduced = document.documentElement.dataset.motion === 'reduced' ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (cartBtn && !isReduced) {
        const startRect = heroImgRef.current.getBoundingClientRect();
        const endRect = cartBtn.getBoundingClientRect();
        const clone = document.createElement('div');
        clone.className = styles.flyClone;
        clone.style.left = `${startRect.left + startRect.width / 2 - 20}px`;
        clone.style.top = `${startRect.top + startRect.height / 2 - 20}px`;
        document.body.appendChild(clone);

        const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
        const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);

        const anim = clone.animate([
          { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
          { transform: `translate3d(${deltaX * 0.5}px, ${deltaY * 0.3 - 30}px, 0) scale(0.8)`, opacity: 0.9 },
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.2)`, opacity: 0 }
        ], {
          duration: 450,
          easing: 'cubic-bezier(0.2, 0, 0, 1)'
        });
        anim.onfinish = () => clone.remove();
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wex:cart-bump'));
    }

    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  const handleInstantOrder = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    navigate('/checkout');
  };

  // Web Share API with WhatsApp / Clipboard fallback
  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `${product.name} بسعر ${formatSdg(product.price_sdg)} في ويكس تكنولوجي`,
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      success('تم نسخ رابط الجهاز للمشاركة');
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`,
        '_blank'
      );
    }
  };

  // Specs map
  const specList = [];
  if (product.specs && typeof product.specs === 'object') {
    if (Array.isArray(product.specs)) {
      product.specs.forEach((s) => {
        specList.push({ key: s.spec_name || s.name || s.spec_key, val: s.spec_value || s.value });
      });
    } else {
      const labelMap = {
        cpu: 'المعالج',
        ram: 'الذاكرة (RAM)',
        storage: 'التخزين',
        screen: 'الشاشة',
        gpu: 'كرت الشاشة',
        battery: 'البطارية',
        ports: 'المنافذ',
        os: 'نظام التشغيل',
      };
      Object.entries(product.specs).forEach(([k, v]) => {
        specList.push({ key: labelMap[k] || k, val: String(v) });
      });
    }
  }

  if (specList.length === 0) {
    if (product.processor) specList.push({ key: 'المعالج', val: product.processor });
    if (product.ram) specList.push({ key: 'الذاكرة', val: product.ram });
    if (product.storage) specList.push({ key: 'التخزين', val: product.storage });
    if (product.screen_size) specList.push({ key: 'مقاس الشاشة', val: product.screen_size });
  }

  specList.push({
    key: t('product.warranty'),
    val: product.warranty_text || (product.condition === 'new' ? 'ضمان معتمد لمدة سنة' : t('product.warrantyDefault')),
    highlight: true,
  });

  return (
    <div className={styles.container}>
      {/* 2-Column Product Main Section (Gallery + Buy Box) */}
      <div className={styles.productLayoutGrid}>
        {/* Gallery Column */}
        <div className={styles.galleryColumn}>
          <div className={styles.heroImageCard}>
            <div className={styles.imageBox} ref={heroImgRef}>
              {displayImage && !imageError ? (
                <img
                  src={displayImage}
                  alt={product.name}
                  className={styles.heroImg}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={styles.svgContainer}>
                  <LaptopSvg
                    silhouette={product.silhouette || 'modern'}
                    accentColor={product.accent_color || '#1E6BFF'}
                  />
                </div>
              )}

              {displayImage && !imageError && (
                <button
                  type="button"
                  className={styles.zoomBtn}
                  onClick={() => setIsZoomOpen(true)}
                  aria-label="تكبير الصورة"
                  title="تكبير الصورة"
                >
                  <Maximize2 size={18} />
                </button>
              )}
            </div>

            {/* Gallery Thumbnails Strip */}
            {images.length > 1 && (
              <div className={styles.galleryThumbs} role="tablist" aria-label="صور المنتج">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={selectedImageIndex === idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`${styles.thumbBtn} ${selectedImageIndex === idx ? styles.thumbBtnActive : ''}`}
                    aria-label={`عرض الصورة ${idx + 1}`}
                  >
                    <img
                      src={getProductImageUrl(img.path || img)}
                      alt={`${product.name} ${idx + 1}`}
                      className={styles.thumbImg}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buy Box Column */}
        <div className={styles.buyBoxColumn}>
          <div className={styles.buyBoxCard}>
            {/* Badges Row */}
            <div className={styles.badgeRow}>
              {condition && <span className={styles.chipCondition}>{condition}</span>}
              {product.brand && (
                <span className={styles.chipBrand}>
                  {product.brand.name || product.brand}
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className={styles.productTitle}>{product.name}</h1>
            {product.subtitle || product.short_description ? (
              <p className={styles.productSubtitle}>
                {product.subtitle || product.short_description}
              </p>
            ) : null}

            {/* Price Row (SDG Only - Western digits & Tabular numerals) */}
            <div className={styles.priceContainer}>
              <div className={styles.priceLabel}>السعر بالجنيه السوداني:</div>
              <div className={styles.priceSdg}>
                {formatSdg(product.price_sdg)}
              </div>
            </div>

            {/* Price Notice */}
            <div className={styles.priceNoticeWrapper}>
              <PriceNotice
                variant="short"
                lockHours={priceLockHours}
                pricesUpdatedAt={shopInfo?.prices_updated_at}
              />
            </div>

            {/* Quantity Stepper & Actions */}
            <div className={styles.purchaseControls}>
              <div className={styles.qtyRow}>
                <span className={styles.qtyLabel}>الكمية المطلوبة:</span>
                <div className={styles.qtyControls} aria-label="اختيار الكمية">
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="تقليل"
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.qtyNum}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    disabled={quantity >= 10 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    aria-label="زيادة"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.mainButtonsRow}>
                <button
                  type="button"
                  className={`${styles.cartBtn} ${isAdded ? styles.cartBtnAdded : ''}`}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  title={isAdded ? t('product.addedToCart') : t('product.addToCart')}
                >
                  {isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
                  <span>{isAdded ? t('product.addedToCart') : t('product.addToCart')}</span>
                </button>

                <button
                  type="button"
                  className={styles.buyNowBtn}
                  onClick={handleInstantOrder}
                  disabled={isOutOfStock}
                >
                  <span>{isOutOfStock ? t('product.outOfStockBadge') : 'اطلب الآن وثبّت السعر'}</span>
                  <Check size={18} />
                </button>
              </div>

              {/* Utility Actions: Share, Compare, Favorite */}
              <div className={styles.secondaryActions}>
                <button
                  type="button"
                  className={styles.actionPillBtn}
                  onClick={handleShare}
                  aria-label="مشاركة رابط الجهاز"
                >
                  <Share2 size={16} />
                  <span>مشاركة</span>
                </button>

                <button
                  type="button"
                  className={`${styles.actionPillBtn} ${inCompare ? styles.actionPillActive : ''}`}
                  onClick={() => addToCompare(product)}
                  aria-label="إضافة للمقارنة"
                >
                  <GitCompare size={16} />
                  <span>{inCompare ? 'في المقارنة' : 'مقارنة'}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.actionPillBtn} ${inFav ? styles.actionPillActive : ''}`}
                  onClick={() => toggleFavorite(product)}
                  aria-label={inFav ? 'في المفضلة' : 'إضافة للمفضلة'}
                >
                  <Heart size={16} fill={inFav ? '#EF4444' : 'none'} color={inFav ? '#EF4444' : 'currentColor'} />
                  <span>{inFav ? 'في المفضلة' : 'حفظ'}</span>
                </button>
              </div>
            </div>

            {/* Quick Guarantees Strip */}
            <div className={styles.guaranteeStrip}>
              <div className={styles.guaranteeCol}>
                <ShieldCheck size={17} className={styles.guarIcon} />
                <span>فحص واختبار كامل لكل قطعة</span>
              </div>
              <div className={styles.guaranteeCol}>
                <MapPin size={17} className={styles.guarIcon} />
                <span>استلام فوري من مول الواحة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Specifications vs Warranty */}
      <div className={styles.tabsSection}>
        <div className={styles.tabNav} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'specs'}
            className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            المواصفات التقنية
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'warranty'}
            className={`${styles.tabBtn} ${activeTab === 'warranty' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('warranty')}
          >
            الضمان والاستلام
          </button>
        </div>

        <div className={styles.tabPanel}>
          {activeTab === 'specs' ? (
            <div className={styles.specsTable}>
              {specList.map((spec, idx) => (
                <div key={idx} className={styles.specTableRow}>
                  <div className={styles.specTableKey}>{spec.key}</div>
                  <div className={spec.highlight ? styles.specTableValHighlight : styles.specTableVal}>
                    {spec.val}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.warrantyPanel}>
              <div className={styles.policyCard}>
                <div className={styles.policyRow}>
                  <ShieldCheck size={20} className={styles.policyIcon} />
                  <div>
                    <h4 className={styles.policyTitle}>سياسة الضمان المعتمد</h4>
                    <p className={styles.policyText}>
                      جميع أجهزتنا تخضع لعملية فحص شاملة للمكونات الداخلية، البطارية، الشاشة، والمنافذ.
                      نمنحك فترة تجربة وفحص تمتد لـ 3 أشهر للأجهزة المستعملة استيراد، وسنة كاملة للأجهزة الجديدة.
                    </p>
                  </div>
                </div>

                <div className={styles.policyRow}>
                  <MapPin size={20} className={styles.policyIcon} />
                  <div>
                    <h4 className={styles.policyTitle}>الاستلام والمعاينة المباشرة</h4>
                    <p className={styles.policyText}>
                      يمكنك تشغيل الجهاز وتجربته بنفسك بمقرنا في مول الواحة بأم درمان قبل سداد أي مبلغ.
                    </p>
                  </div>
                </div>

                <div className={styles.policyRow}>
                  <Truck size={20} className={styles.policyIcon} />
                  <div>
                    <h4 className={styles.policyTitle}>التوصيل الآمن داخل الخرطوم والولايات</h4>
                    <p className={styles.policyText}>
                      نوفر شحنًا موثوقًا مع مندوبنا المعتمد لجميع مناطق أم درمان وبحري والخرطوم مع تسليم إشعار رسمي.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compatible Accessories Rail */}
      {relatedAccessories.length > 0 && (
        <section className={styles.extraRailSection} aria-label="ملحقات متوافقة">
          <h3 className={styles.extraRailTitle}>يكمل جهازك</h3>
          <div className={styles.extraRailGrid}>
            {relatedAccessories.map((acc, idx) => (
              <ProductCard key={acc.id} product={acc} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Rail */}
      {recentlyViewed.length > 0 && (
        <section className={styles.extraRailSection} aria-label="شاهدتها مؤخرًا">
          <h3 className={styles.extraRailTitle}>شاهدتها مؤخرًا</h3>
          <div className={styles.extraRailGrid}>
            {recentlyViewed.map((item, idx) => (
              <ProductCard key={item.id} product={item} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Zoom Modal */}
      {isZoomOpen && displayImage && (
        <div
          className={styles.zoomModalBackdrop}
          onClick={() => setIsZoomOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={styles.zoomCloseBtn}
            onClick={() => setIsZoomOpen(false)}
            aria-label="إغلاق"
          >
            <X size={24} />
          </button>
          <img
            src={displayImage}
            alt={product.name}
            className={styles.zoomedImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Bottom spacer on mobile */}
      <div className={styles.bottomSpacer} />

      {/* Sticky Bottom Action Bar (Mobile Only) */}
      <div className={styles.mobileStickyActionBar}>
        <div className={styles.mobileQtyControls}>
          <button
            type="button"
            className={styles.qtyBtn}
            disabled={quantity <= 1 || isOutOfStock}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="تقليل"
          >
            <Minus size={14} />
          </button>
          <span className={styles.qtyNum}>{quantity}</span>
          <button
            type="button"
            className={styles.qtyBtn}
            disabled={quantity >= 10 || isOutOfStock}
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            aria-label="زيادة"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          className={`${styles.mobileCartBtn} ${isAdded ? styles.cartBtnAdded : ''}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          title={isAdded ? t('product.addedToCart') : t('product.addToCart')}
          aria-label={isAdded ? t('product.addedToCart') : t('product.addToCart')}
        >
          {isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
          <span>{isAdded ? t('product.addedToCart') : 'أضف للسلة'}</span>
        </button>

        <button
          type="button"
          className={styles.mobileOrderBtn}
          onClick={handleInstantOrder}
          disabled={isOutOfStock}
        >
          <span>{isOutOfStock ? t('product.outOfStockBadge') : 'اطلب وثبّت السعر'}</span>
          <Check size={18} />
        </button>
      </div>
    </div>
  );
}
