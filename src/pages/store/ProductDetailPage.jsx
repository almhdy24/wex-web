import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Minus, ShoppingCart, MapPin, ZoomIn } from 'lucide-react';
import { productsApi } from '../../api/products';
import { formatSdg, formatAed, getProductImageUrl, getStockStatusInfo, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Tag from '../../components/common/Tag';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import ProductCard from '../../components/products/ProductCard';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { success } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setQuantity(1);

    productsApi
      .getProductDetail(slug)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data;
        setProduct(data);
        if (data.images && data.images.length > 0) {
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
        <div className={styles.mainLayout}>
          <Skeleton height="360px" borderRadius="var(--radius-lg)" />
          <div>
            <Skeleton width="40%" height="24px" />
            <div style={{ height: 16 }} />
            <Skeleton width="80%" height="36px" />
            <div style={{ height: 16 }} />
            <Skeleton width="50%" height="28px" />
            <div style={{ height: 16 }} />
            <Skeleton height="120px" borderRadius="var(--radius-md)" />
          </div>
        </div>
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

  const stock = getStockStatusInfo(product.stock_status);
  const condition = getConditionLabel(product.condition);
  const isOutOfStock =
    product.stock_status === 'out_of_stock' ||
    (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const displayImage = getProductImageUrl(selectedImage);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    success(`تمت إضافة ${quantity} من "${product.name}" إلى السلة`);
  };

  const specEntries =
    product.specs && typeof product.specs === 'object'
      ? Object.entries(product.specs)
      : [];

  const specLabelMap = {
    cpu: 'المعالج (CPU)',
    ram: 'الذاكرة (RAM)',
    storage: 'التخزين (Storage)',
    screen: 'الشاشة',
    gpu: 'كرت الشاشة (GPU)',
    battery: 'البطارية',
    os: 'نظام التشغيل',
    color: 'اللون',
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb navigation */}
      <nav className={styles.breadcrumb} aria-label="مسار التنقل">
        <Link to="/">الرئيسية</Link>
        <span>/</span>
        <Link to="/products">المتجر</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/products?category=${product.category.slug}`}>
              {product.category.name_ar}
            </Link>
          </>
        )}
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* Main product view */}
      <div className={styles.mainLayout}>
        {/* Gallery */}
        <div className={styles.gallerySection}>
          <div
            className={styles.mainImageCard}
            onClick={() => setZoomOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="تكبير صورة المنتج"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setZoomOpen(true);
            }}
          >
            <img
              src={displayImage}
              alt={product.name}
              className={styles.mainImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/favicon.svg';
              }}
            />
            <div className={styles.zoomHint}>
              <ZoomIn size={14} />
              <span>تكبير</span>
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className={styles.thumbnailStrip}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.path)}
                  className={`${styles.thumbnailBtn} ${
                    selectedImage === img.path ? styles.thumbnailBtnActive : ''
                  }`}
                  aria-label="عرض الصورة"
                >
                  <img
                    src={getProductImageUrl(img.thumb_path || img.path)}
                    alt=""
                    className={styles.thumbnailImg}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className={styles.infoSection}>
          <div className={styles.badgeRow}>
            <Tag variant={stock.variant}>{stock.label}</Tag>
            {condition && <Tag variant="neutral">{condition}</Tag>}
            {product.brand && <Tag variant="info">{product.brand.name}</Tag>}
          </div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          {product.short_description && (
            <p className={styles.shortDesc}>{product.short_description}</p>
          )}

          {/* Price Box */}
          <div className={styles.priceBox}>
            <div className={styles.priceValues}>
              <span className={styles.sdgPrice}>
                {formatSdg(product.price_sdg)}
              </span>
              {product.price_aed && (
                <span className={styles.aedPrice}>
                  (يعادل: {formatAed(product.price_aed)})
                </span>
              )}
            </div>
            <p className={styles.priceNote}>
              السعر بالدرهم وبيتغير مع الصرف. بنثبته ليك بعد الطلب.
            </p>
          </div>

          {/* Warranty Line from API */}
          {product.warranty_text && (
            <div className={styles.warrantyNote}>
              <ShieldCheck size={18} className={styles.warrantyIcon} />
              <span>الضمان: {product.warranty_text}</span>
            </div>
          )}

          {/* Desktop Purchase Actions */}
          <div className={styles.desktopActions}>
            <div className={styles.qtyPicker} aria-label="اختيار الكمية">
              <button
                type="button"
                className={styles.qtyBtn}
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="تقليل الكمية"
              >
                <Minus size={16} />
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button
                type="button"
                className={styles.qtyBtn}
                disabled={quantity >= 10 || isOutOfStock}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="زيادة الكمية"
              >
                <Plus size={16} />
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              className={styles.desktopAddBtn}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              <span>{isOutOfStock ? 'نفد من المخزن' : 'أضف للسلة'}</span>
            </Button>
          </div>

          <div className={styles.storeNote}>
            <MapPin size={16} />
            <span>متوفر للاستلام من المحل (مول الواحة - أم درمان) أو التوصيل</span>
          </div>
        </div>
      </div>

      {/* Technical Specifications Definition List */}
      {specEntries.length > 0 && (
        <section className={styles.specsSection} aria-label="المواصفات الفنية">
          <h2 className={styles.sectionHeading}>المواصفات الفنية</h2>
          <dl className={styles.specsList}>
            {specEntries.map(([key, val]) => (
              <div key={key} className={styles.specRow}>
                <dt className={styles.specTerm}>
                  {specLabelMap[key] || key}
                </dt>
                <dd className={styles.specDesc}>
                  {String(val)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Description */}
      {product.description && (
        <section className={styles.specsSection} aria-label="تفاصيل الجهاز">
          <h2 className={styles.sectionHeading}>تفاصيل الجهاز</h2>
          <p className={styles.descText}>{product.description}</p>
        </section>
      )}

      {/* Accessories */}
      {product.accessories && product.accessories.length > 0 && (
        <section className={styles.accessoriesSection} aria-label="ملحقات متوافقة">
          <h2 className={styles.sectionHeading}>ملحقات متوافقة</h2>
          <div className={styles.accessoriesGrid}>
            {product.accessories.map((acc) => (
              <ProductCard key={acc.id} product={acc} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Bottom Bar */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.mobilePriceInfo}>
          <span className={styles.mobileSdgPrice}>
            {formatSdg(product.price_sdg)}
          </span>
          {product.price_aed && (
            <span className={styles.mobileAedPrice}>
              {formatAed(product.price_aed)}
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="md"
          className={styles.mobileAddBtn}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} />
          <span>{isOutOfStock ? 'نفد' : 'أضف للسلة'}</span>
        </Button>
      </div>

      {/* Image Zoom Modal */}
      <Modal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        title={product.name}
      >
        <div className={styles.imageModal}>
          <img
            src={displayImage}
            alt={product.name}
            className={styles.modalImage}
          />
        </div>
      </Modal>
    </div>
  );
}
