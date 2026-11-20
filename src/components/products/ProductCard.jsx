import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, Heart, GitCompare } from 'lucide-react';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { t } from '../../content/ar';
import LaptopSvg from '../common/LaptopSvg';
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

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { success } = useToast();
  const [imageError, setImageError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const imgRef = useRef(null);

  if (!product) return null;

  const fav = isFavorite(product.id);
  const inComp = isInCompare(product.id);
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
    setIsAdded(true);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignore haptic errors on unsupported devices
      }
    }

    success({
      title: t('toast.addedToCartTitle', 'أُضيف إلى السلة'),
      detail: <LatinText>{product.name}</LatinText>,
      action: {
        label: t('toast.viewCartAction', 'عرض السلة'),
        onClick: () => navigate('/cart'),
      },
      dedupeKey: `cart-${product.id}`,
    });

    // Fly-to-cart WAAPI animation
    if (typeof window !== 'undefined' && imgRef.current) {
      const cartBtn = document.getElementById('app-bar-cart-btn');
      const isReduced = document.documentElement.dataset.motion === 'reduced' ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (cartBtn && !isReduced) {
        const startRect = imgRef.current.getBoundingClientRect();
        const endRect = cartBtn.getBoundingClientRect();
        const clone = document.createElement('div');
        clone.className = styles.flyClone;
        clone.style.left = `${startRect.left + startRect.width / 2 - 18}px`;
        clone.style.top = `${startRect.top + startRect.height / 2 - 18}px`;
        document.body.appendChild(clone);

        const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
        const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);

        const anim = clone.animate([
          { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
          { transform: `translate3d(${deltaX * 0.5}px, ${deltaY * 0.3 - 24}px, 0) scale(0.8)`, opacity: 0.9 },
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.2)`, opacity: 0 }
        ], {
          duration: 420,
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

  return (
    <article
      className={styles.card}
      style={{ '--i': index }}
    >
      <Link to={`/products/${product.slug || product.id}`} className={styles.cardLink}>
        {/* Favorite Button */}
        <button
          type="button"
          className={`${styles.favBtn} ${fav ? styles.favBtnActive : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product);
          }}
          aria-label={fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          title={fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          <Heart size={15} fill={fav ? '#EF4444' : 'none'} />
        </button>

        {/* Compare Toggle Button */}
        <button
          type="button"
          className={`${styles.compareBtn} ${inComp ? styles.compareBtnActive : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (inComp) {
              removeFromCompare(product.id);
            } else {
              addToCompare(product);
            }
          }}
          aria-pressed={inComp}
          aria-label={inComp ? 'في المقارنة' : 'أضف للمقارنة'}
          title={inComp ? 'في المقارنة' : 'أضف للمقارنة'}
        >
          <GitCompare size={14} />
        </button>

        {/* Condition Badge (Top End in RTL) */}
        {condition && (
          <span className={styles.cardBadge}>
            {condition}
          </span>
        )}

        {/* 4:3 Product Image Container on Ice-to-White Gradient */}
        <div className={styles.imageContainer} ref={imgRef}>
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
            <LatinText>{product.name}</LatinText>
          </h3>

          {/* Quick Specs Line */}
          {quickSpecs.length > 0 && (
            <div className={styles.quickSpecs}>
              <span className={styles.specsLine}>
                <SpecValue value={quickSpecs.join(' · ')} />
              </span>
            </div>
          )}

          {/* Pricing (SDG Only - Western Digits & Tabular Numerals) */}
          <div className={styles.pricing}>
            <div className={styles.priceSdg}>
              <span>{formatSdg(product.price_sdg)}</span>
            </div>

            {isOutOfStock ? (
              <span className={styles.outOfStockNotice}>{t('product.outOfStockBadge')}</span>
            ) : isLowStock ? (
              <span className={styles.lowStockNotice}>
                {product.stock_quantity ? t('product.onlyLeft', { count: product.stock_quantity }) : t('product.lowStockBadge')}
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
          className={`${styles.addCartBtn} ${isAdded ? styles.addedBtn : ''}`}
          title={isAdded ? t('product.addedToCart') : t('product.addToCart')}
          aria-label={isAdded ? t('product.addedToCart') : t('product.addToCart')}
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <Check size={16} className={styles.checkIcon} />
              <span>{t('product.addedToCart')}</span>
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              <span>{t('product.addToCart')}</span>
            </>
          )}
        </button>
      )}
    </article>
  );
}
