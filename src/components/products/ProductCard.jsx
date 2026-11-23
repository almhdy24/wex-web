import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, Heart } from 'lucide-react';
import { getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { t } from '../../content/ar';
import { ProductImage, BrandRibbons, Price } from '../common';
import LatinText from '../common/LatinText';
import { triggerHaptic } from '../../utils/haptics';
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

export default function ProductCard({ product, index, style = {} }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { success } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const fav = isFavorite(product.id);
  const condition = getConditionLabel(product.condition);
  const isNew = String(product.condition || '').toLowerCase() === 'new' || (condition && condition.includes('جديد'));
  const isOutOfStock =
    product.stock_status === 'out_of_stock' ||
    (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const imageUrl = getProductImageUrl(product.image?.thumb_path || product.image?.path || product.primary_image_url);
  const quickSpecs = getQuickSpecs(product);
  const descriptionText = product.short_description || (quickSpecs.length > 0 ? quickSpecs.join(' · ') : '');

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem(product, 1);
    triggerHaptic(10);
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
    }, 700);
  };

  const itemIndex = typeof index === 'number' ? Math.min(index, 8) : 0;

  return (
    <article
      className={styles.card}
      style={{ '--i': itemIndex, ...style }}
    >
      <Link to={`/products/${product.slug || product.id}`} className={styles.cardLink}>
        {/* Image Stage */}
        <div className={styles.imageContainer}>
          <BrandRibbons variant="tile" />

          {/* Product Image / Placeholder */}
          <div className={styles.imageInner}>
            <ProductImage
              src={imageUrl}
              alt={product.name}
              type={product.type || 'laptop'}
              size={58}
              stroke="var(--wex-gray-400)"
              strokeWidth={1.3}
              className={styles.image}
              fallbackClassName={styles.svgWrapper}
            />
          </div>

          {/* Condition Badge (Top Start Side) */}
          {condition && (
            <span className={`${styles.cardBadge} ${isNew ? styles.badgeNew : styles.badgeUsed}`}>
              {condition}
            </span>
          )}

          {/* Favorite Button (Top End Side) */}
          <button
            type="button"
            className={`${styles.favBtn} ${fav ? styles.favBtnActive : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerHaptic(10);
              toggleFavorite(product);
            }}
            aria-label={fav ? 'إزالة من المفضلة' : 'حفظ'}
            title={fav ? 'إزالة من المفضلة' : 'حفظ'}
          >
            <Heart
              size={16}
              strokeWidth={2}
              fill={fav ? '#dc2626' : 'none'}
              color={fav ? '#dc2626' : 'var(--wex-navy)'}
            />
          </button>

          {/* Unavailable Overlay */}
          {isOutOfStock && (
            <div className={styles.unavailableOverlay}>
              <span className={styles.unavailablePill}>{t('product.outOfStock', 'غير متوفر حاليًا')}</span>
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className={styles.info}>
          <h3 className={styles.name} title={product.name} dir="auto">
            <LatinText>{product.name}</LatinText>
          </h3>

          {descriptionText && (
            <p className={styles.description} dir="auto">
              {descriptionText}
            </p>
          )}

          {/* Price Row */}
          <div className={styles.pricing}>
            <Price value={product.price_sdg} size="md" tone="royal" />
          </div>
        </div>
      </Link>

      {/* Add Button (only when available) */}
      {!isOutOfStock && (
        <button
          type="button"
          onClick={handleAddToCart}
          className={`${styles.addCartBtn} ${isAdded ? styles.addedBtn : ''}`}
          aria-label={isAdded ? t('product.addedToCart', 'أُضيف إلى السلة') : t('product.quickAdd', 'أضف')}
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <Check size={18} strokeWidth={2} />
              <span>{t('product.quickAdd', 'أضف')}</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} strokeWidth={2} />
              <span>{t('product.quickAdd', 'أضف')}</span>
            </>
          )}
        </button>
      )}
    </article>
  );
}
