import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  GitCompare,
  Share2,
  Maximize2,
  X,
  MapPin,
  Clock,
  Truck,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import LaptopSvg from '../../components/common/LaptopSvg';
import Button from '../../components/common/Button';
import styles from './ProductDetailPage.module.css';

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

  useEffect(() => {
    if (initialProduct !== null) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      productsApi.getProductDetail(slug),
      productsApi.getShopSettings().catch(() => ({ data: null })),
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
      <div className={styles.loadingContainer}>
        <div className={styles.imageSkeleton} />
        <div className={styles.lineSkeleton} />
        <div className={styles.lineSkeleton} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error || 'الجهاز غير موجود'}</p>
        <Button variant="secondary" onClick={() => navigate('/products')}>
          تصفّح الأجهزة
        </Button>
      </div>
    );
  }

  const isFav = isFavorite(product.id);
  const inComp = isInCompare(product.id);
  const isOutOfStock = product.stock_status === 'out_of_stock' || product.stock_quantity === 0;

  // Images
  const rawImages = product.images || [];
  const primaryImg = product.primary_image || (rawImages.length > 0 ? rawImages[0] : null);
  const displayImage = !imageError && primaryImg ? getProductImageUrl(primaryImg) : null;

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
      label: 'المعالج',
      value: product.processor || product.cpu || specsMap.processor || specsMap.cpu || null,
    },
    {
      label: 'الذاكرة العشوائية',
      value: product.ram || specsMap.ram || null,
    },
    {
      label: 'التخزين',
      value: product.storage || specsMap.storage || null,
    },
    {
      label: 'كرت الشاشة',
      value: product.gpu || product.graphics || specsMap.gpu || specsMap.graphics || null,
    },
    {
      label: 'الشاشة',
      value: product.screen || product.screen_size || specsMap.screen || specsMap.screen_size || null,
    },
    {
      label: 'البطارية',
      value: product.battery || specsMap.battery || null,
    },
  ];

  // Warranty row: only if API provides text
  if (product.warranty_text && String(product.warranty_text).trim()) {
    specRows.push({
      label: 'الاستلام والمعاينة',
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
    <div className={styles.container}>
      {/* Product Image Card */}
      <div className={styles.imageCard}>
        <div className={styles.imageBox}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className={styles.mainImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.placeholderBox}>
              <LaptopSvg />
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

          {/* Favorite button at top corner */}
          <button
            type="button"
            className={`${styles.favButton} ${isFav ? styles.favButtonActive : ''}`}
            onClick={() => toggleFavorite(product)}
            aria-label={isFav ? 'إزالة من المحفوظات' : 'حفظ'}
          >
            <Heart
              size={20}
              strokeWidth={1.75}
              fill={isFav ? 'var(--wex-royal)' : 'none'}
              stroke={isFav ? 'var(--wex-royal)' : 'var(--wex-navy)'}
              aria-hidden="true"
            />
          </button>
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
      </div>

      {/* Main Info Card */}
      <div className={styles.infoCard}>
        {/* Condition Tag */}
        {conditionLabel && (
          <span className={styles.conditionTag}>{conditionLabel}</span>
        )}

        {/* Title */}
        <h1 className={styles.title}>{product.name}</h1>

        {/* Price & Single Caption */}
        <div className={styles.priceBlock}>
          <div className={styles.priceRow}>
            <span className={styles.priceValue}>{formatSdg(product.price_sdg)}</span>
          </div>
          <p className={styles.priceCaption}>
            السعر قابل للتغيير حتى تأكيد الطلب.
          </p>
        </div>

        {/* Secondary Actions (Compare, Share) */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={`${styles.actionBtn} ${inComp ? styles.actionBtnActive : ''}`}
            onClick={handleToggleCompare}
          >
            <GitCompare size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>مقارنة</span>
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleShare}
          >
            <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>مشاركة</span>
          </button>
        </div>
      </div>

      {/* Tabs Card */}
      <div className={styles.tabsCard}>
        <div className={styles.tabHeader} role="tablist">
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

        <div className={styles.tabContent}>
          {activeTab === 'specs' ? (
            <div className={styles.specsList}>
              {specRows
                .filter((row) => row.value)
                .map((row, idx) => (
                  <div key={idx} className={styles.specRow}>
                    <span className={styles.specLabel}>{row.label}</span>
                    <span className={styles.specValue}>{row.value}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className={styles.deliveryContent}>
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
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className={styles.stickyBar}>
        <div className={styles.quantityStepper}>
          <button
            type="button"
            className={styles.stepperBtn}
            disabled={quantity <= 1 || isOutOfStock}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="تقليل"
          >
            <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className={styles.quantityNumber}>{quantity}</span>
          <button
            type="button"
            className={styles.stepperBtn}
            disabled={isOutOfStock}
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="زيادة"
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.ctaButtons}>
          <Button
            variant="secondary"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={styles.addToCartBtn}
          >
            <ShoppingCart size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>أضف إلى السلة</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleOrderNow}
            disabled={isOutOfStock}
            className={styles.orderNowBtn}
          >
            اطلب الآن
          </Button>
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
    </div>
  );
}
