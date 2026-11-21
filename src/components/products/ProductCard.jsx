import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, Heart } from 'lucide-react';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { t } from '../../content/ar';
import { ProductImage } from '../common';
import LatinText from '../common/LatinText';
import SpecValue from '../../utils/formatSpecValue';
import styles from './ProductCard.module.css';

/**
 * Extract 1-3 quick spec strings from product
 */
function getQuickSpecs(product) {
  if (product.specs && Array.isArray(product.specs) && product.specs.length > 0) {
    return product.specs
      .slice(0, 3)
      .map((s) => s.spec_value || s.value)
      .filter(Boolean);
  }
  const pills = [];
  if (product.cpu) pills.push(product.cpu);
  if (product.ram) pills.push(product.ram);
  if (product.storage) pills.push(product.storage);
  if (pills.length === 0 && product.short_description) {
    const parts = product.short_description.split(/[,·|]/);
    parts.forEach((p) => {
      const trimmed = p.trim();
      if (trimmed && pills.length < 3) pills.push(trimmed);
    });
  }
  return pills.slice(0, 3);
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { success } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const fav = isFavorite(product.id);
  const condition = getConditionLabel(product.condition);
  const isOutOfStock =
    product.stock_status === 'out_of_stock' ||
    (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const imageUrl = getProductImageUrl(product.image?.thumb_path || product.image?.path);
  const quickSpecs = getQuickSpecs(product);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem(product, 1);
    setIsAdded(true);

    success({
      title: t('toast.addedToCartTitle', 'أُضيف إلى السلة'),
      detail: <LatinText>{product.name}</LatinText>,
      action: {
        label: t('toast.viewCartAction', 'عرض السلة'),
        onClick: () => navigate('/cart'),
      },
      dedupeKey: `cart-${product.id}`,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wex:cart-bump'));
    }

    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.slug || product.id}`} className={styles.cardLink}>
        {/* Favorite Button (Heart active = royal filled, no red) */}
        <button
          type="button"
          className={`${styles.favBtn} ${fav ? styles.favBtnActive : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          aria-label={fav ? 'إزالة من المفضلة' : 'حفظ'}
          title={fav ? 'إزالة من المفضلة' : 'حفظ'}
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            fill={fav ? 'var(--wex-royal)' : 'none'}
            color="var(--wex-royal)"
          />
        </button>

        {/* Condition Tag */}
        {condition && <span className={styles.cardBadge}>{condition}</span>}

        {/* Image Area */}
        <div className={styles.imageContainer}>
          <ProductImage
            src={imageUrl}
            alt={product.name}
            type={product.type || 'laptop'}
            className={styles.image}
            fallbackClassName={styles.svgWrapper}
          />
        </div>

        {/* Product Info */}
        <div className={styles.info}>
          <h3 className={styles.name} title={product.name}>
            <LatinText>{product.name}</LatinText>
          </h3>

          {/* Spec Line: "i5 · 8GB · 256GB" */}
          {quickSpecs.length > 0 && (
            <div className={styles.specsLine}>
              <SpecValue value={quickSpecs.join(' · ')} />
            </div>
          )}

          {/* Price on one line */}
          <div className={styles.pricing}>
            <span className={styles.priceSdg}>{formatSdg(product.price_sdg)}</span>
          </div>
        </div>
      </Link>

      {/* Button "أضف" with cart icon + label */}
      {!isOutOfStock ? (
        <button
          type="button"
          onClick={handleAddToCart}
          className={`${styles.addCartBtn} ${isAdded ? styles.addedBtn : ''}`}
          aria-label={isAdded ? t('product.addedToCart', 'أُضيف إلى السلة') : t('product.quickAdd', 'أضف')}
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <Check size={18} strokeWidth={1.75} />
              <span>{t('product.quickAdd', 'أضف')}</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} strokeWidth={1.75} />
              <span>{t('product.quickAdd', 'أضف')}</span>
            </>
          )}
        </button>
      ) : (
        <div className={styles.outOfStockBadge}>{t('product.outOfStock', 'غير متوفر حاليًا')}</div>
      )}
    </article>
  );
}
