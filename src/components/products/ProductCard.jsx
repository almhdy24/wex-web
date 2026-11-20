import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatSdg, formatAed, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import LaptopSvg from '../common/LaptopSvg';
import styles from './ProductCard.module.css';

/**
 * Extract 1-2 quick spec pills from product
 */
function getQuickSpecs(product) {
  if (product.specs && Array.isArray(product.specs) && product.specs.length > 0) {
    return product.specs
      .slice(0, 2)
      .map((s) => s.spec_value || s.value)
      .filter(Boolean);
  }
  const pills = [];
  if (product.ram) pills.push(product.ram);
  if (product.storage) pills.push(product.storage);
  if (pills.length === 0 && product.short_description) {
    const parts = product.short_description.split(/[,·|]/);
    if (parts[0]) pills.push(parts[0].trim());
    if (parts[1]) pills.push(parts[1].trim());
  }
  return pills.slice(0, 2);
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { success } = useToast();
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const condition = getConditionLabel(product.condition);
  const isOutOfStock = product.stock_status === 'out_of_stock' || (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const isLowStock = !isOutOfStock && ((product.stock_quantity > 0 && product.stock_quantity <= 3) || product.stock_status === 'low_stock');
  const imageUrl = getProductImageUrl(product.image?.thumb_path || product.image?.path);
  const quickSpecs = getQuickSpecs(product);
  const brandName = product.brand?.name || product.brand_name || '';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
    success(`تمت إضافة "${product.name}" إلى السلة`);
  };

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.slug || product.id}`} className={styles.cardLink}>
        {/* Condition Badge (Top Right) */}
        {condition && (
          <span className={styles.cardBadge}>
            {condition}
          </span>
        )}

        {/* Product Image Container (120px) */}
        <div className={styles.imageContainer}>
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className={styles.image}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.svgWrapper}>
              <LaptopSvg
                silhouette={product.silhouette || 'modern'}
                accentColor={product.accent_color || '#1E6BFF'}
              />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.info}>
          {brandName && <span className={styles.brand}>{brandName}</span>}
          <h3 className={styles.name} title={product.name}>
            {product.name}
          </h3>

          {/* Quick Specs Pills */}
          {quickSpecs.length > 0 && (
            <div className={styles.quickSpecs}>
              {quickSpecs.map((spec, idx) => (
                <span key={idx} className={styles.specPill}>
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div className={styles.pricing}>
            <div className={styles.priceSdg}>
              <span>{formatSdg(product.price_sdg)}</span>
            </div>
            {product.price_aed ? (
              <div className={styles.priceAed}>
                {formatAed(product.price_aed)}
              </div>
            ) : null}

            {isOutOfStock ? (
              <span className={styles.outOfStockNotice}>نفد من المخزن</span>
            ) : isLowStock ? (
              <span className={styles.lowStockNotice}>
                {product.stock_quantity ? `باقي ${product.stock_quantity} فقط` : 'كمية محدودة'}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Quick Add to Cart Action */}
      {!isOutOfStock && (
        <button
          type="button"
          onClick={handleAddToCart}
          className={styles.addCartBtn}
          title="أضف إلى السلة"
          aria-label={`أضف ${product.name} إلى السلة`}
        >
          <ShoppingCart size={16} />
          <span>إضافة للسلة</span>
        </button>
      )}
    </article>
  );
}
