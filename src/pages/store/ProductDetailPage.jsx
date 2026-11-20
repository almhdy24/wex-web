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
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import PriceNotice, { formatPricesUpdatedAt } from '../../components/common/PriceNotice';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { t } from '../../content/ar';
import LaptopSvg from '../../components/common/LaptopSvg';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import ProductCard from '../../components/products/ProductCard';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { success } = useToast();

  const [product, setProduct] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [relatedAccessories, setRelatedAccessories] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const heroImgRef = useRef(null);

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
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'تعذر العثور على الجهاز المطلوب');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="220px" borderRadius="var(--radius-xl)" />
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
        // Ignore haptics errors on unsupported devices
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

  // Warranty
  specList.push({
    key: t('product.warranty'),
    val: product.warranty_text || (product.condition === 'new' ? 'ضمان معتمد لمدة سنة' : t('product.warrantyDefault')),
    highlight: true,
  });

  return (
    <div className={styles.container}>
      {/* 1. Hero Image Card with Gallery & Tap to Zoom */}
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
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>

        {/* Thumbnail Dots/Strip if multiple images */}
        {images.length > 1 && (
          <div className={styles.galleryThumbs} role="tablist" aria-label="صور المنتج">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={selectedImageIndex === idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`${styles.thumbDot} ${selectedImageIndex === idx ? styles.thumbDotActive : ''}`}
                aria-label={`صورة ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Condition & Brand Badges */}
        <div className={styles.badgeRow}>
          {condition && <span className={styles.chipCondition}>{condition}</span>}
          {product.brand && (
            <span className={styles.chipBrand}>
              {product.brand.name || product.brand}
            </span>
          )}
        </div>
      </div>

      {/* 2. Product Name & Subtitle */}
      <div className={styles.nameSection}>
        <h1 className={styles.productTitle}>{product.name}</h1>
        {product.subtitle || product.short_description ? (
          <p className={styles.productSubtitle}>
            {product.subtitle || product.short_description}
          </p>
        ) : null}
      </div>

      {/* 3. Price Box (SDG Only - No Reference Currency, No Rate) */}
      <div className={`${styles.priceBox} wex-ribbon-subtle`}>
        <div className={styles.priceRow}>
          <div>
            <div className={styles.priceLabel}>السعر بالجنيه:</div>
            <div className={styles.priceSdg}>
              <span>{formatSdg(product.price_sdg)}</span>
            </div>
          </div>
          {shopInfo?.prices_updated_at && (
            <div className={styles.lastUpdateLine}>
              {t('priceNotice.pricesUpdatedAt', { time: formatPricesUpdatedAt(shopInfo.prices_updated_at) })}
            </div>
          )}
        </div>

        <div className={styles.priceNoticeWrapper}>
          <PriceNotice
            variant="full"
            lockHours={priceLockHours}
            pricesUpdatedAt={shopInfo?.prices_updated_at}
          />
        </div>
      </div>

      {/* 4. Specs Table Card */}
      <div className={styles.specsCard}>
        <h2 className={styles.specsTitle}>{t('product.specifications')}</h2>
        <div className={styles.specsList}>
          {specList.map((spec, idx) => (
            <div key={idx} className={styles.specRow}>
              <span className={styles.specKey}>{spec.key}:</span>
              <span className={spec.highlight ? styles.specValHighlight : styles.specVal}>
                {spec.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Store Notes & Inspection Policy */}
      <div className={styles.notesCard}>
        <h3 className={styles.notesTitle}>ملاحظات عن الجهاز:</h3>
        <p className={styles.notesText}>
          {product.description ||
            'جهاز بحالة ممتازة تم اختباره والتأكد من أداء المعالج والبطارية والشاشة والمنافذ بالكامل.'}
        </p>

        <div className={styles.guaranteeRow}>
          <div className={styles.guaranteeItem}>
            <ShieldCheck size={16} className={styles.guaranteeIcon} />
            <span>معاينة وفحص مباشر قبل الدفع في المحل</span>
          </div>
          <div className={styles.guaranteeItem}>
            <MapPin size={16} className={styles.guaranteeIcon} />
            <span>استلام من مول الواحة — أم درمان أو توصيل مباشر</span>
          </div>
        </div>
      </div>

      {/* 6. "يكمل جهازك" Accessories Rail (if available) */}
      {relatedAccessories.length > 0 && (
        <section className={styles.accessoriesSection} aria-label="ملحقات متوافقة">
          <h3 className={styles.accessoriesTitle}>يكمل جهازك</h3>
          <div className={styles.accessoriesRail}>
            {relatedAccessories.map((acc, idx) => (
              <div key={acc.id} className={styles.accCardWrap}>
                <ProductCard product={acc} index={idx} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Zoom Modal */}
      {isZoomOpen && displayImage && (
        <div className={styles.zoomModalBackdrop} onClick={() => setIsZoomOpen(false)} role="dialog" aria-modal="true">
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

      {/* Bottom spacer so content doesn't hide behind sticky action bar */}
      <div className={styles.bottomSpacer} />

      {/* 7. Sticky Bottom Action Bar */}
      <div className={styles.stickyActionBar}>
        <div className={styles.actionLeft}>
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

          <button
            type="button"
            className={`${styles.cartBtn} ${isAdded ? styles.cartBtnAdded : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            title={isAdded ? t('product.addedToCart') : t('product.addToCart')}
            aria-label={isAdded ? t('product.addedToCart') : t('product.addToCart')}
          >
            {isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
          </button>
        </div>

        <button
          type="button"
          className={`${styles.orderNowBtn} btn-vivid`}
          onClick={handleInstantOrder}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? (
            <span>{t('product.outOfStockBadge')}</span>
          ) : (
            <>
              <Check size={18} />
              <span>{t('checkout.submitOrderButton')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
