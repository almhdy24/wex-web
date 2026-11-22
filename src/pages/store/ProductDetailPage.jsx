import { useState, useEffect } from 'react';
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
  X,
  MapPin,
  Truck,
  Info,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { shopApi } from '../../api/shop';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { ProductTypeSvg } from '../../components/common';
import AppBar from '../../components/common/AppBar';
import BrandRibbons from '../../components/common/BrandRibbons';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
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
} = {}) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addItem } = useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState(initialProduct);
  const [shopInfo, setShopInfo] = useState(initialShopInfo);
  const [shippingZones, setShippingZones] = useState(initialShippingZones || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(initialLoading ?? (initialProduct === null));
  const [error, setError] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'delivery'
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (initialProduct !== null) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      productsApi.getProductDetail(slug),
      shopApi.getShop().catch(() => ({ data: null })),
      productsApi.getShippingZones().catch(() => ({ data: [] })),
    ])
      .then(([prodRes, shopRes, zonesRes]) => {
        if (!isMounted) return;
        setProduct(prodRes?.data || null);
        setShopInfo(shopRes?.data || null);
        setShippingZones(zonesRes?.data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'تعذر تحميل بيانات الجهاز');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, initialProduct]);

  if (loading) {
    return (
      <Page className={styles.loadingContainer}>
        <div className={styles.imageSkeleton} />
        <div className={styles.lineSkeleton} />
        <div className={styles.lineSkeleton} />
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
  const rawImages = product.images || [];
  const primaryImg = product.primary_image || (rawImages.length > 0 ? rawImages[0] : null);
  const rawImageUrl = primaryImg ? getProductImageUrl(primaryImg) : null;
  const isRealPhoto = rawImageUrl && !rawImageUrl.includes('favicon.svg');
  const displayImage = !imageError && isRealPhoto ? rawImageUrl : null;

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

  // Warranty row: only if API provides text
  if (product.warranty_text && String(product.warranty_text).trim()) {
    specRows.push({
      key: 'warranty',
      label: 'الاستلام والتسليم',
      value: String(product.warranty_text).trim(),
    });
  }

  // Factual shop and delivery info
  const shopAddress = shopInfo?.address || 'مول الواحة، الشهداء، أم درمان';
  const shopHours = 'السبت - الخميس: 9:00 ص - 9:00 م، الجمعة: مغلق';
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
        style={{ '--header-bottom': '84px' }}
        title={product.name}
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
              fill={isFav ? 'var(--wex-cyan)' : 'none'}
              stroke={isFav ? 'var(--wex-cyan)' : 'var(--wex-white)'}
              aria-hidden="true"
            />
          </button>

          {/* Image or White line-art icon */}
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className={styles.stageImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.stagePlaceholder}>
              <ProductTypeSvg type={product.type || 'laptop'} />
            </div>
          )}

          {displayImage && (
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
        {rawImages.length > 1 && (
          <div className={styles.thumbnailsRow} role="tablist" aria-label="صور المنتج">
            {rawImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.thumbBtn} ${selectedImageIndex === idx ? styles.thumbBtnActive : ''}`}
                onClick={() => {
                  setSelectedImageIndex(idx);
                  setImageError(false);
                }}
                aria-label={`عرض الصورة ${idx + 1}`}
              >
                <img
                  src={getProductImageUrl(img.image_url || img.path || img)}
                  alt=""
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
            <span className={styles.priceNumber}>
              {Number(product.price_sdg).toLocaleString('en-US')}
            </span>
            <span className={styles.priceCurrency}>ج.س</span>
            <span className={styles.srOnly}>{formatSdg(product.price_sdg)}</span>
          </div>

          <div className={styles.priceNoticeBox}>
            <div className={styles.noticeIconBox}>
              <Info size={18} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className={styles.priceCaption}>
              السعر قابل للتغيير حتى تأكيد الطلب.
            </p>
          </div>
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
        <div className={styles.tabsContainer} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'specs'}
            className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            المواصفات
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'delivery'}
            className={`${styles.tabBtn} ${activeTab === 'delivery' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            الاستلام والتوصيل
          </button>
        </div>

        {/* Specs or Delivery Card */}
        {activeTab === 'specs' ? (
          <div className={styles.specsCard}>
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
                  <span className={styles.specValue} dir="auto">{row.value}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className={styles.deliveryCard}>
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
        <div className={styles.purchaseBar}>
          <div className={styles.purchasePriceCol}>
            <span className={styles.purchasePriceLabel}>السعر</span>
            <span className={styles.purchasePriceValue}>
              {Number(product.price_sdg).toLocaleString('en-US')} ج.س
            </span>
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
              disabled={isOutOfStock}
              onClick={() => setQuantity((q) => q + 1)}
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
        </div>

        {/* Zoom Modal */}
        {isZoomOpen && displayImage && (
          <div
            className={styles.zoomModal}
            role="dialog"
            aria-modal="true"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              type="button"
              className={styles.zoomCloseBtn}
              onClick={() => setIsZoomOpen(false)}
              aria-label="إغلاق"
            >
              <X size={24} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <img
              src={displayImage}
              alt={product.name}
              className={styles.zoomImg}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </Page>
    </div>
  );
}
