import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, ShieldCheck, MapPin, Check } from 'lucide-react';
import { productsApi } from '../../api/products';
import { formatSdg, formatAed, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import LaptopSvg from '../../components/common/LaptopSvg';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { success } = useToast();

  const [product, setProduct] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setImageError(false);

    Promise.all([
      productsApi.getProductDetail(slug),
      productsApi.getShopInfo().catch(() => ({ data: null })),
    ])
      .then(([prodRes, shopRes]) => {
        if (!isMounted) return;
        const data = prodRes.data;
        setProduct(data);
        setShopInfo(shopRes?.data || null);
        if (data?.images && data.images.length > 0) {
          const primary = data.images.find((img) => img.is_primary) || data.images[0];
          setSelectedImage(primary.path);
        } else {
          setSelectedImage(null);
        }
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
          title="الجهاز غير متوفر"
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
  const displayImage = selectedImage ? getProductImageUrl(selectedImage) : null;
  const exchangeRate = shopInfo?.exchange_rate_sdg || 650;
  const priceLockHours = shopInfo?.price_lock_hours || 4;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    success(`تمت إضافة ${quantity} من "${product.name}" إلى السلة`);
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
        warranty: 'فترة الضمان',
      };
      Object.entries(product.specs).forEach(([k, v]) => {
        specList.push({ key: labelMap[k] || k, val: String(v) });
      });
    }
  }

  // If no specs from backend, add core attributes if present
  if (specList.length === 0) {
    if (product.processor) specList.push({ key: 'المعالج', val: product.processor });
    if (product.ram) specList.push({ key: 'الذاكرة', val: product.ram });
    if (product.storage) specList.push({ key: 'التخزين', val: product.storage });
    if (product.screen_size) specList.push({ key: 'مقاس الشاشة', val: product.screen_size });
  }

  // Always append warranty
  specList.push({
    key: 'الضمان',
    val: product.warranty_text || (product.condition === 'new' ? 'ضمان سنة كاملة' : 'ضمان فحص واستبدال 3 أشهر'),
    highlight: true,
  });

  return (
    <div className={styles.container}>
      {/* 1. Hero Image Card (Mockup Parity: 180px illustration/photo) */}
      <div className={styles.heroImageCard}>
        <div className={styles.imageBox}>
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
        </div>

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

      {/* 3. Price Box (Mockup Parity: wex-ribbon-subtle) */}
      <div className={`${styles.priceBox} wex-ribbon-subtle`}>
        <div className={styles.priceRow}>
          <div>
            <div className={styles.priceLabel}>السعر بالجنيه:</div>
            <div className={styles.priceSdg}>
              <span>{formatSdg(product.price_sdg)}</span>
            </div>
            {product.price_aed ? (
              <div className={styles.priceAed}>
                ({formatAed(product.price_aed)})
              </div>
            ) : null}
          </div>

          <div className={styles.rateChipWrapper}>
            <div className={styles.rateChip}>
              <span className={styles.pulseDot} />
              <span>الدرهم اليوم: {exchangeRate} جنيه</span>
            </div>
          </div>
        </div>

        <div className={styles.priceLockNote}>
          <span>سعر اللابتوب بالدرهم وبيتغير مع الصرف. لما تطلب، بنثبت ليك السعر لمدة {priceLockHours} ساعات وبتحول فيها عبر بنكك. لو المدة انتهت بيرجع السعر للصرف الحالي.</span>
        </div>
      </div>

      {/* 4. Specs Table Card */}
      <div className={styles.specsCard}>
        <h3 className={styles.specsTitle}>مواصفات الجهاز</h3>
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
        <h4 className={styles.notesTitle}>ملاحظات عن الجهاز:</h4>
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
            <span>استلام من مول الواحة — أم درمان أو شحن</span>
          </div>
        </div>
      </div>

      {/* Bottom spacer so content doesn't hide behind sticky action bar */}
      <div className={styles.bottomSpacer} />

      {/* 6. Sticky Bottom Action Bar (Replaces bottom tab bar) */}
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
            className={styles.cartBtn}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            title="إضافة للسلة"
            aria-label="إضافة للسلة"
          >
            <ShoppingCart size={18} />
          </button>
        </div>

        <button
          type="button"
          className={`${styles.orderNowBtn} btn-vivid`}
          onClick={handleInstantOrder}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? (
            <span>نفد من المخزن</span>
          ) : (
            <>
              <Check size={18} />
              <span>اطلب الآن وثبّت السعر</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
