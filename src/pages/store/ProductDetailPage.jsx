import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Check,
  Plus,
  Minus,
  Heart,
  GitCompare,
  Share2,
  Maximize2,
  MapPin,
  Truck,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { shopApi } from '../../api/shop';
import { getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { ProductTypeSvg } from '../../components/common';
import AppBar from '../../components/common/AppBar';
import BrandRibbons from '../../components/common/BrandRibbons';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import Lightbox from '../../components/common/Lightbox';
import Price from '../../components/common/Price';
import NoticeLine from '../../components/common/NoticeLine';
import Tabs from '../../components/common/Tabs';
import StickyBar from '../../components/common/StickyBar';
import Skeleton from '../../components/common/Skeleton';
import { swrCache } from '../../utils/swrCache';
import { normalizeShopInfo } from '../../utils/shopSettings';
import SpecValue from '../../utils/formatSpecValue';
import styles from './ProductDetailPage.module.css';

function getSpecPath(label = '', key = '') {
  const l = (label + ' ' + key).toLowerCase();
  if (l.includes('معالج') || l.includes('processor') || l.includes('cpu')) {
    return 'M8 8h8v8H8zM10 4v4M14 4v4M10 16v4M14 16v4M4 10h4M4 14h4M16 10h4M16 14h4';
  }
  if (l.includes('ذاكرة') || l.includes('ram')) {
    return 'M3 8h18v8H3zM7 8v8M11 8v8M15 8v8M6 19v-3M18 19v-3';
  }
  if (l.includes('تخزين') || l.includes('storage') || l.includes('ssd') || l.includes('hdd')) {
    return 'M4 6h16v5H4zM4 13h16v5H4zM7.5 8.5h.01M7.5 15.5h.01';
  }
  if (l.includes('شاشة') && (l.includes('كرت') || l.includes('gpu') || l.includes('graphics'))) {
    return 'M3 7h18v9H3zM3 19h6M14 11.5a2.5 2.5 0 1 0 0 .01';
  }
  if (l.includes('بطارية') || l.includes('battery')) {
    return 'M6 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM21 11v2';
  }
  if (l.includes('استلام') || l.includes('delivery')) {
    return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
  }
  if (l.includes('شاشة') || l.includes('screen') || l.includes('display')) {
    return 'M3 5h18v11H3zM8 20h8M12 16v4';
  }
  return 'M3 5h18v11H3zM8 20h8M12 16v4';
}

export default function ProductDetailPage({
  initialProduct = null,
  initialShopInfo = null,
  initialShippingZones = null,
  initialLoading = null,
  initialTab = 'specs',
} = {}) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addItem } = useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { success, error: toastError } = useToast();

  const cacheKey = slug ? `pdp_${slug}` : null;
  const cached = cacheKey ? swrCache.get(cacheKey) : null;

  const [product, setProduct] = useState(() => initialProduct || cached?.data?.product || null);
  const [shopInfo, setShopInfo] = useState(() => {
    const raw = initialShopInfo || cached?.data?.shopInfo;
    return raw ? normalizeShopInfo(raw) : null;
  });
  const [shippingZones, setShippingZones] = useState(() => initialShippingZones || cached?.data?.shippingZones || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(
    initialLoading ?? (initialProduct === null && !cached?.data?.product)
  );
  const [error, setError] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'specs' | 'delivery'
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (initialProduct !== null) return;
    let isMounted = true;
    if (!cached?.data?.product) {
      setLoading(true);
    }
    setError(null);
    const controller = new AbortController();

    Promise.all([
      productsApi.getProductDetail(slug, { signal: controller.signal }),
      shopApi.getShop({ signal: controller.signal }).catch(() => ({ data: null })),
      productsApi.getShippingZones({ signal: controller.signal }).catch(() => ({ data: [] })),
    ])
      .then(([prodRes, shopRes, zonesRes]) => {
        if (!isMounted) return;
        const freshProduct = prodRes?.data || null;
        const freshShop = shopRes?.data ? normalizeShopInfo(shopRes.data) : null;
        const freshZones = zonesRes?.data || [];
        setProduct(freshProduct);
        setShopInfo(freshShop);
        setShippingZones(freshZones);
        if (cacheKey) {
          swrCache.set(cacheKey, {
            product: freshProduct,
            shopInfo: freshShop,
            shippingZones: freshZones,
          });
        }
      })
      .catch((err) => {
        if (!isMounted || err?.name === 'AbortError') return;
        if (!cached?.data?.product) {
          setError(err.message || 'تعذر تحميل بيانات الجهاز');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [slug, initialProduct]);

  if (loading) {
    return (
      <Page className={styles.loadingContainer}>
        <Skeleton height="250px" borderRadius="var(--radius-panel)" />
        <Skeleton height="24px" width="80%" borderRadius="var(--radius-control)" />
        <Skeleton height="24px" width="60%" borderRadius="var(--radius-control)" />
      </Page>
    );
  }

  if (error || !product) {
    return (
      <Page className={styles.errorContainer}>
        <p className={styles.errorText}>{error || 'الجهاز غير موجود'}</p>
        <Button variant="secondary" onClick={() => navigate('/products')}>
          تصفّح الأجهزة
        </Button>
      </Page>
    );
  }

  const isFav = isFavorite(product.id);
  const inComp = isInCompare(product.id);
  const isOutOfStock = product.stock_status === 'out_of_stock' || product.stock_quantity === 0;

  // Images
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const imgs = product.images || [];
    if (imgs.length > 0) {
      return imgs.map((img) => ({
        url: getProductImageUrl(img.thumb_path || img.path || img.image_url || img),
        fullUrl: getProductImageUrl(img.path || img.image_url || img.thumb_path || img),
        alt: img.alt || product.name || 'صورة الجهاز',
      }));
    }
    const single = product.primary_image || product.thumb_url || product.image_path;
    if (single) {
      const url = getProductImageUrl(single);
      return [{
        url,
        fullUrl: url,
        alt: product.name || 'صورة الجهاز',
      }];
    }
    return [];
  }, [product]);

  const slideRefs = useRef([]);
  const scrollToSlide = (idx) => {
    setSelectedImageIndex(idx);
    if (slideRefs.current[idx]) {
      slideRefs.current[idx].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  // Condition
  const conditionLabel = getConditionLabel(product.condition);

  // Specifications
  const specsMap = {};
  if (Array.isArray(product.specs)) {
    product.specs.forEach((s) => {
      const k = (s.spec_key || s.name || s.spec_name || '').toLowerCase();
      const v = s.spec_value || s.value || '';
      specsMap[k] = v;
    });
  } else if (product.specs && typeof product.specs === 'object') {
    Object.entries(product.specs).forEach(([k, v]) => {
      specsMap[k.toLowerCase()] = String(v);
    });
  }

  const specRows = [
    {
      key: 'processor',
      label: 'المعالج',
      value: product.processor || product.cpu || specsMap.processor || specsMap.cpu || null,
    },
    {
      key: 'ram',
      label: 'الذاكرة العشوائية',
      value: product.ram || specsMap.ram || null,
    },
    {
      key: 'storage',
      label: 'التخزين',
      value: product.storage || specsMap.storage || null,
    },
    {
      key: 'graphics',
      label: 'كرت الشاشة',
      value: product.gpu || product.graphics || specsMap.gpu || specsMap.graphics || null,
    },
    {
      key: 'screen',
      label: 'الشاشة',
      value: product.screen || product.screen_size || specsMap.screen || specsMap.screen_size || null,
    },
    {
      key: 'battery',
      label: 'البطارية',
      value: product.battery || specsMap.battery || null,
    },
  ];

  // Inspection/delivery note row: only if API provides text
  if (product.warranty_text && String(product.warranty_text).trim()) {
    specRows.push({
      key: 'warranty',
      label: 'الاستلام والتسليم',
      value: String(product.warranty_text).trim(),
    });
  }

  // Full spec grouping: add any remaining specs from product.specs
  const knownKeys = new Set(['processor', 'cpu', 'ram', 'storage', 'graphics', 'gpu', 'screen', 'screen_size', 'battery', 'warranty']);
  if (Array.isArray(product.specs)) {
    product.specs.forEach((s) => {
      const k = (s.spec_key || s.name || s.spec_name || '').toLowerCase();
      const rawLabel = s.spec_name || s.name || s.label;
      const v = s.spec_value || s.value || '';
      if (!knownKeys.has(k) && v && rawLabel) {
        specRows.push({
          key: k,
          label: rawLabel,
          value: v,
        });
        knownKeys.add(k);
      }
    });
  }

  // Stock and quantity limits
  const stockCount = typeof product.stock_quantity === 'number'
    ? product.stock_quantity
    : (isOutOfStock ? 0 : 10);
  const maxQuantity = Math.max(1, Math.min(10, stockCount > 0 ? stockCount : 1));

  // Factual shop and delivery info
  const shopAddress = shopInfo?.address || 'مول الواحة، الشهداء، أم درمان';
  const shopHours = shopInfo?.business_hours || 'السبت - الخميس: 9:00 ص - 9:00 م، الجمعة: مغلق';
  const zonesText =
    shippingZones.length > 0
      ? shippingZones.map((z) => z.zone_name || z.name).join('، ')
      : 'أم درمان، الخرطوم، بحري والولايات';

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 700);
    success('تمت إضافة الجهاز إلى السلة');
  };

  const handleOrderNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    navigate('/checkout');
  };

  const handleToggleCompare = () => {
    if (inComp) {
      removeFromCompare(product.id);
      success('تمت إزالة الجهاز من المقارنة');
    } else {
      addToCompare(product);
      success('تمت إضافة الجهاز إلى المقارنة');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        success('تم نسخ الرابط');
      } catch {
        toastError('تعذر نسخ الرابط');
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <AppBar
        tone="navy"
        overlap={84}
        title={product.name}
        titleAs="span"
        showBack={true}
        backTo="/products"
        showCart={true}
      />

      <Page className={styles.container}>
        {/* Image stage */}
        <div className={styles.imageStage}>
          <BrandRibbons variant="panel" />

          {/* Condition badge top inline-start 14px */}
          {conditionLabel && (
            <span className={styles.conditionBadge}>{conditionLabel}</span>
          )}

          {/* Favorite button top inline-end 12px */}
          <button
            type="button"
            className={`${styles.glassFavBtn} ${isFav ? styles.glassFavBtnActive : ''}`}
            onClick={() => toggleFavorite(product)}
            aria-label={isFav ? 'إزالة من المحفوظات' : 'حفظ'}
          >
            <Heart
              size={20}
              strokeWidth={1.75}
              fill={isFav ? 'var(--wex-danger, #ef4444)' : 'none'}
              stroke={isFav ? 'var(--wex-danger, #ef4444)' : 'currentColor'}
              aria-hidden="true"
            />
          </button>

          {/* Swipeable Gallery or Fallback */}
          {galleryImages.length > 0 && !imageError ? (
            <>
              <div
                className={styles.galleryScroll}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const itemWidth = el.clientWidth || 1;
                  const idx = Math.round(Math.abs(el.scrollLeft) / itemWidth);
                  if (idx >= 0 && idx < galleryImages.length && idx !== selectedImageIndex) {
                    setSelectedImageIndex(idx);
                  }
                }}
              >
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    ref={(el) => {
                      slideRefs.current[idx] = el;
                    }}
                    className={styles.gallerySlide}
                    onClick={() => setIsZoomOpen(true)}
                    role="button"
                    tabIndex={0}
                    aria-label={`تكبير الصورة ${idx + 1}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setIsZoomOpen(true);
                      }
                    }}
                  >
                    <img
                      src={img.fullUrl}
                      alt={img.alt}
                      className={styles.stageImage}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : 'auto'}
                      decoding="async"
                      width="400"
                      height="300"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ))}
              </div>

              {galleryImages.length > 1 && (
                <div className={styles.dotsRow}>
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.dot} ${selectedImageIndex === idx ? styles.dotActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToSlide(idx);
                      }}
                      aria-label={`الانتقال إلى الصورة ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.stagePlaceholder}>
              <ProductTypeSvg type={product.type || 'laptop'} />
            </div>
          )}

          {galleryImages.length > 0 && !imageError && (
            <button
              type="button"
              className={styles.zoomButton}
              onClick={() => setIsZoomOpen(true)}
              aria-label="تكبير الصورة"
            >
              <Maximize2 size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Gallery Thumbnails */}
        {galleryImages.length > 1 && (
          <div className={styles.thumbnailsRow} role="tablist" aria-label="صور المنتج">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={selectedImageIndex === idx}
                className={`${styles.thumbBtn} ${selectedImageIndex === idx ? styles.thumbBtnActive : ''}`}
                onClick={() => scrollToSlide(idx)}
                aria-label={`عرض الصورة ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt=""
                  width="56"
                  height="56"
                  loading="lazy"
                  decoding="async"
                  className={styles.thumbImage}
                />
              </button>
            ))}
          </div>
        )}

        {/* Title Block */}
        <div className={styles.titleBlock}>
          <h1 className={styles.title} dir="auto">{product.name}</h1>

          <div className={styles.priceRow}>
            <Price value={product.price_sdg} size="xl" tone="royal" />
            {stockCount > 0 && stockCount <= 3 && !isOutOfStock && (
              <span className={styles.lowStockBadge}>متبقي {stockCount} فقط</span>
            )}
          </div>

          <NoticeLine variant="secondary" className={styles.priceNoticeBox}>
            السعر قابل للتغيير حتى تأكيد الطلب.
          </NoticeLine>
        </div>

        {/* Compare / Share Buttons */}
        <div className={styles.compareShareGrid}>
          <button
            type="button"
            className={`${styles.gridActionBtn} ${inComp ? styles.gridActionBtnActive : ''}`}
            onClick={handleToggleCompare}
          >
            <GitCompare size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>مقارنة</span>
          </button>
          <button
            type="button"
            className={styles.gridActionBtn}
            onClick={handleShare}
          >
            <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>مشاركة</span>
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'specs', label: 'المواصفات' },
            { id: 'delivery', label: 'الاستلام والتوصيل' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="تفاصيل الجهاز"
          className={styles.tabsContainer}
        />

        {/* Specs or Delivery Card */}
        {activeTab === 'specs' ? (
          <div role="tabpanel" id="tabpanel-specs" aria-labelledby="tab-specs" className={styles.specsCard}>
            {specRows
              .filter((row) => row.value)
              .map((row, idx) => (
                <div key={idx} className={styles.specRow}>
                  <div className={styles.specIconBox}>
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d={getSpecPath(row.label, row.key)} />
                    </svg>
                  </div>
                  <span className={styles.specLabel}>{row.label}</span>
                  <SpecValue value={row.value} className={styles.specValue} />
                </div>
              ))}
          </div>
        ) : (
          <div role="tabpanel" id="tabpanel-delivery" aria-labelledby="tab-delivery" className={styles.deliveryCard}>
            <div className={styles.deliverySection}>
              <div className={styles.deliveryHeading}>
                <MapPin size={18} strokeWidth={1.75} className={styles.deliveryIcon} aria-hidden="true" />
                <strong>الاستلام من المحل</strong>
              </div>
              <p className={styles.deliveryText}>
                الاستلام من {shopAddress}. ساعات العمل: {shopHours}.
              </p>
            </div>

            <div className={styles.deliverySection}>
              <div className={styles.deliveryHeading}>
                <Truck size={18} strokeWidth={1.75} className={styles.deliveryIcon} aria-hidden="true" />
                <strong>التوصيل</strong>
              </div>
              <p className={styles.deliveryText}>
                التوصيل متاح إلى: {zonesText}. تُحتسب الرسوم حسب المنطقة عند تأكيد الطلب.
              </p>
            </div>
          </div>
        )}

        {/* Purchase Bar (Fixed) */}
        <StickyBar className={styles.purchaseBar} innerClassName={styles.purchaseBarInner}>
          <div className={styles.purchasePriceCol}>
            <span className={styles.purchasePriceLabel}>السعر</span>
            <Price value={product.price_sdg} size="title" />
          </div>

          <div className={styles.stepperBox}>
            <button
              type="button"
              className={styles.stepperMinus}
              disabled={quantity <= 1 || isOutOfStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="تقليل"
            >
              <Minus size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className={styles.stepperNum}>{quantity}</span>
            <button
              type="button"
              className={styles.stepperPlus}
              disabled={quantity >= maxQuantity || isOutOfStock}
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              aria-label="زيادة"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.purchaseButtonsRow}>
            <button
              type="button"
              className={styles.cartIconButton}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              aria-label="أضف إلى السلة"
              title="أضف إلى السلة"
            >
              {isAdded ? (
                <Check size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <ShoppingCart size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
              <span className={styles.srOnly}>أضف إلى السلة</span>
            </button>

            <button
              type="button"
              className={isOutOfStock ? styles.orderBtnUnavailable : styles.orderBtnPrimary}
              disabled={isOutOfStock}
              onClick={handleOrderNow}
            >
              {isOutOfStock ? 'غير متوفر حاليًا' : 'اطلب الآن'}
            </button>
          </div>
        </StickyBar>

        {/* Fullscreen Lightbox */}
        <Lightbox
          isOpen={isZoomOpen && galleryImages.length > 0}
          images={galleryImages.map((g) => ({ url: g.fullUrl, alt: g.alt }))}
          initialIndex={selectedImageIndex}
          onClose={() => setIsZoomOpen(false)}
        />
      </Page>
    </div>
  );
}
