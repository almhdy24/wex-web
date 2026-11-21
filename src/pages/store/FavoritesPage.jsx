import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ArrowLeft,
  ShoppingCart,
  Trash2,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatSdg, getProductImageUrl, getConditionLabel } from '../../utils/formatters';
import { ProductImage } from '../../components/common';
import LatinText from '../../components/common/LatinText';
import SpecValue from '../../utils/formatSpecValue';
import Page from '../../components/common/Page';
import { ar } from '../../content/ar';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites, moveToCart } = useFavorites();
  const { addItem } = useCart();
  const { success, info } = useToast();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [movingId, setMovingId] = useState(null);

  const handleMoveAllToCart = () => {
    const inStockItems = favorites.filter(
      (p) => p.stock_status !== 'out_of_stock' && (p.stock_quantity === undefined || p.stock_quantity > 0)
    );

    if (inStockItems.length === 0) {
      info('لا توجد أجهزة متوفرة حالياً في قائمتك لنقلها للسلة');
      return;
    }

    inStockItems.forEach((p) => {
      addItem(p, 1);
      removeFavorite(p.id, true);
    });

    success({
      title: `تم نقل ${inStockItems.length} أجهزة إلى سلة المشتريات`,
      action: {
        label: 'عرض السلة',
        onClick: () => navigate('/cart'),
      },
    });
  };

  const handleSingleMove = (product) => {
    setMovingId(product.id);
    moveToCart(product, true);
    setTimeout(() => {
      setMovingId(null);
    }, 400);
  };

  return (
    <Page className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <div className={styles.titleIconBadge}>
              <Heart size={20} className={styles.titleHeartIcon} fill="#EF4444" />
            </div>
            <h1 className={styles.title}>{ar.wishlist.title}</h1>
          </div>
          <p className={styles.subtitle}>
            {favorites.length > 0
              ? `لديك ${favorites.length} جهاز محفوظ للمتابعة والشراء الفوري بأم درمان`
              : ar.wishlist.subtitle}
          </p>
        </div>

        {favorites.length > 0 && (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.moveAllBtn}
              onClick={handleMoveAllToCart}
              title={ar.wishlist.moveAllToCart}
            >
              <ShoppingCart size={16} />
              <span>{ar.wishlist.moveAllToCart}</span>
            </button>

            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setConfirmClearOpen(true)}
              title={ar.wishlist.clearAll}
            >
              <Trash2 size={16} />
              <span>{ar.wishlist.clearAll}</span>
            </button>
          </div>
        )}
      </div>

      {/* Price Lock Notice Banner */}
      {favorites.length > 0 && (
        <div className={styles.noticeBanner}>
          <PackageCheck size={18} className={styles.noticeIcon} />
          <span>{ar.wishlist.priceNotice}</span>
        </div>
      )}

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconCircle}>
            <Heart size={44} className={styles.emptyIcon} />
          </div>
          <h2 className={styles.emptyTitle}>{ar.wishlist.emptyTitle}</h2>
          <p className={styles.emptyDesc}>{ar.wishlist.emptySubtitle}</p>

          <div className={styles.quickChipsWrapper}>
            <span className={styles.chipsLabel}>أقسام شائعة للتصفح:</span>
            <div className={styles.quickChips}>
              <Link to="/products?category=laptops" className={styles.chip}>
                {ar.wishlist.categoryLaptops}
              </Link>
              <Link to="/products?category=accessories" className={styles.chip}>
                {ar.wishlist.categoryAccessories}
              </Link>
              <Link to="/products?sort=newest" className={styles.chip}>
                وصل حديثاً للمحل
              </Link>
            </div>
          </div>

          <Link to="/products" className={styles.browseBtn}>
            <span>{ar.wishlist.exploreCatalog}</span>
            <ArrowLeft size={16} />
          </Link>
        </div>
      ) : (
        /* Wishlist Responsive Product Grid */
        <div className={styles.grid}>
          {favorites.map((product) => {
            const isOutOfStock =
              product.stock_status === 'out_of_stock' ||
              (product.stock_quantity !== undefined && product.stock_quantity <= 0) ||
              (product.stock !== undefined && product.stock <= 0);
            const isLowStock =
              !isOutOfStock &&
              ((product.stock_quantity > 0 && product.stock_quantity <= 3) ||
                (product.stock > 0 && product.stock <= 3) ||
                product.stock_status === 'low_stock');
            const imageUrl = getProductImageUrl(
              product.image?.thumb_path || product.image?.path || product.images?.[0]?.image_url
            );
            const condition = getConditionLabel(product.condition);

            return (
              <article key={product.id} className={styles.card}>
                {/* Remove heart toggle button */}
                <button
                  type="button"
                  className={styles.favToggleBtn}
                  onClick={() => removeFavorite(product.id)}
                  aria-label={ar.wishlist.removeFromWishlist}
                  title={ar.wishlist.removeFromWishlist}
                >
                  <Heart size={16} fill="#EF4444" color="#EF4444" />
                </button>

                {/* Product Image Link */}
                <Link
                  to={`/products/${product.slug || product.id}`}
                  className={styles.imageLink}
                  aria-label={product.name}
                >
                  <ProductImage
                    src={imageUrl}
                    alt={product.name}
                    type={product.type || 'laptop'}
                    className={styles.productImg}
                    fallbackClassName={styles.fallbackSvg}
                  />
                </Link>

                {/* Card Content */}
                <div className={styles.cardBody}>
                  {/* Top Meta: Brand & Availability */}
                  <div className={styles.metaRow}>
                    {product.brand?.name || product.brand_name ? (
                      <span className={styles.brandBadge}>
                        {product.brand?.name || product.brand_name}
                      </span>
                    ) : (
                      <span className={styles.brandBadge}>{condition}</span>
                    )}

                    <span
                      className={`${styles.stockPill} ${
                        isOutOfStock
                          ? styles.stockOut
                          : isLowStock
                          ? styles.stockLow
                          : styles.stockIn
                      }`}
                    >
                      {isOutOfStock
                        ? ar.wishlist.outOfStock
                        : isLowStock
                        ? ar.wishlist.lowStock
                        : ar.wishlist.inStock}
                    </span>
                  </div>

                  {/* Title */}
                  <Link
                    to={`/products/${product.slug || product.id}`}
                    className={styles.nameLink}
                  >
                    <h2 className={styles.productName}>
                      <LatinText>{product.name}</LatinText>
                    </h2>
                  </Link>

                  {/* Quick specs preview */}
                  {product.specs && Array.isArray(product.specs) && product.specs.length > 0 ? (
                    <div className={styles.specsList}>
                      {product.specs.slice(0, 3).map((s, idx) => (
                        <span key={idx} className={styles.specTag}>
                          <SpecValue value={s.spec_value || s.value} />
                        </span>
                      ))}
                    </div>
                  ) : (product.processor || product.ram || product.storage) ? (
                    <div className={styles.specsList}>
                      {product.processor && (
                        <span className={styles.specTag}>
                          <SpecValue value={product.processor} />
                        </span>
                      )}
                      {product.ram && (
                        <span className={styles.specTag}>
                          <SpecValue value={product.ram} />
                        </span>
                      )}
                      {product.storage && (
                        <span className={styles.specTag}>
                          <SpecValue value={product.storage} />
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Price & Actions Row */}
                  <div className={styles.footerRow}>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceLabel}>السعر المثبت:</span>
                      <span className={styles.priceValue}>
                        {formatSdg(product.price_sdg)}
                      </span>
                    </div>

                    <div className={styles.actionsGroup}>
                      <button
                        type="button"
                        className={`${styles.cartBtn} ${
                          isOutOfStock ? styles.cartBtnDisabled : ''
                        }`}
                        onClick={() => handleSingleMove(product)}
                        disabled={isOutOfStock || movingId === product.id}
                        title={isOutOfStock ? ar.wishlist.outOfStock : ar.wishlist.moveToCart}
                      >
                        <ShoppingCart size={15} />
                        <span>
                          {isOutOfStock
                            ? ar.wishlist.outOfStock
                            : movingId === product.id
                            ? 'جاري النقل...'
                            : ar.wishlist.moveToCart}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={styles.removeIconBtn}
                        onClick={() => removeFavorite(product.id)}
                        title={ar.wishlist.removeFromWishlist}
                        aria-label={ar.wishlist.removeFromWishlist}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Clearing All */}
      {confirmClearOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setConfirmClearOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalDangerIcon}>
                <AlertCircle size={22} />
              </div>
              <h3 className={styles.modalTitle}>{ar.wishlist.clearAllConfirmTitle}</h3>
            </div>

            <p className={styles.modalBody}>{ar.wishlist.clearAllConfirmBody}</p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setConfirmClearOpen(false)}
              >
                {ar.account.cancel}
              </button>
              <button
                type="button"
                className={styles.confirmDangerBtn}
                onClick={() => {
                  clearFavorites();
                  setConfirmClearOpen(false);
                }}
              >
                {ar.wishlist.clearAll}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
