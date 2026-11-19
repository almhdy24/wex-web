import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatSdg, formatAed, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import styles from './ProductCard.module.css';

/**
 * Extract a concise one-line spec summary from product specs or description
 */
function getSpecLine(product) {
  if (product.specs && Array.isArray(product.specs) && product.specs.length > 0) {
    return product.specs
      .slice(0, 3)
      .map((s) => s.spec_value || s.value)
      .filter(Boolean)
      .join(' · ');
  }
  if (product.short_description) {
    return product.short_description;
  }
  return '';
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { success } = useToast();

  if (!product) return null;

  const condition = getConditionLabel(product.condition);
  const isOutOfStock = product.stock_status === 'out_of_stock' || (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const isLowStock = !isOutOfStock && ((product.stock_quantity > 0 && product.stock_quantity <= 3) || product.stock_status === 'low_stock');
  const imageUrl = getProductImageUrl(product.image?.thumb_path || product.image?.path);
  const specSummary = getSpecLine(product);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
    success(`تمت إضافة "${product.name}" إلى السلة`);
  };

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.slug || product.id}`} className={styles.link}>
        <div className={styles.imageWrapper}>
          <img
            src={imageUrl}
            alt={product.name}
            className={styles.image}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/favicon.svg';
            }}
          />
          {condition && (
            <span className={styles.conditionBadge}>
              {condition}
            </span>
          )}
        </div>

        <div className={styles.content}>
          <h3 className={styles.title} title={product.name}>
            {product.name}
          </h3>

          {specSummary ? (
            <p className={styles.specLine}>{specSummary}</p>
          ) : (
            <p className={styles.specLine}>&nbsp;</p>
          )}

          <div className={styles.pricing}>
            <div className={styles.priceRow}>
              <span className={styles.sdgPrice}>
                {formatSdg(product.price_sdg)}
              </span>
              {product.price_aed && (
                <span className={styles.aedPrice}>
                  {formatAed(product.price_aed)}
                </span>
              )}
            </div>

            {isOutOfStock ? (
              <span className={styles.outOfStockNotice}>نفد من المخزن</span>
            ) : isLowStock ? (
              <span className={styles.stockNotice}>
                {product.stock_quantity ? `باقي ${product.stock_quantity} فقط` : 'كمية محدودة'}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className={styles.actionFooter}>
        <Button
          variant={isOutOfStock ? 'outline' : 'primary'}
          size="sm"
          className={styles.addBtn}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          aria-label={isOutOfStock ? 'نفد من المخزن' : `أضف ${product.name} إلى السلة`}
        >
          <ShoppingCart size={16} strokeWidth={2} />
          {isOutOfStock ? 'نفد' : 'أضف للسلة'}
        </Button>
      </div>
    </article>
  );
}
