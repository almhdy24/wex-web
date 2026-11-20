import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import LaptopSvg from '../../components/common/LaptopSvg';
import EmptyState from '../../components/common/EmptyState';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalItems, estimatedSubtotalSdg } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="السلة فاضية"
          description="لسه ما ضفت أي جهاز أو ملحق للسلة."
          actionLabel="تصفح الأجهزة"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const appDiscount = Math.round(estimatedSubtotalSdg * 0.03);
  const estimatedTotal = Math.max(0, estimatedSubtotalSdg - appDiscount);

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>سلة المشتريات</h1>
          <span className={styles.subtitle}>{totalItems} أجهزة في السلة</span>
        </div>

        <button type="button" onClick={clearCart} className={styles.clearBtn} title="إفراغ السلة">
          <Trash2 size={14} />
          <span>إفراغ</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className={styles.itemsList}>
        {items.map((item) => {
          const imgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path);
          const lineTotal = (item.price_sdg || 0) * item.quantity;

          return (
            <div key={item.id} className={styles.itemCard}>
              {/* Product Thumbnail */}
              <div className={styles.thumbBox}>
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className={styles.thumbImg}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/favicon.svg';
                    }}
                  />
                ) : (
                  <LaptopSvg
                    silhouette={item.silhouette || 'modern'}
                    accentColor={item.accent_color || '#1E6BFF'}
                  />
                )}
              </div>

              {/* Product Details & Stepper */}
              <div className={styles.itemDetails}>
                <div className={styles.itemNameRow}>
                  <Link to={`/products/${item.slug || item.id}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={styles.removeBtn}
                    aria-label={`حذف ${item.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className={styles.itemPriceRow}>
                  <div className={styles.priceCol}>
                    <span className={styles.linePrice}>{formatSdg(lineTotal)}</span>
                    {item.quantity > 1 && (
                      <span className={styles.unitPrice}>({formatSdg(item.price_sdg)} للقطعة)</span>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className={styles.stepper} aria-label="الكمية">
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="تقليل"
                    >
                      <Minus size={13} />
                    </button>
                    <span className={styles.stepCount}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      disabled={item.quantity >= 10}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="زيادة"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card with 3% App Discount Preview */}
      <div className={styles.summaryCard}>
        <h3 className={styles.summaryTitle}>تفاصيل السعر التقديري:</h3>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>المجموع المبدئي:</span>
          <span className={styles.summaryVal}>{formatSdg(estimatedSubtotalSdg)}</span>
        </div>

        <div className={styles.discountRow}>
          <span>خصم الطلب بالتطبيق (3%):</span>
          <span className={styles.discountVal}>- {formatSdg(appDiscount)}</span>
        </div>

        <div className={styles.totalRow}>
          <div>
            <div className={styles.totalLabel}>الإجمالي التقديري:</div>
            <div className={styles.totalVal}>{formatSdg(estimatedTotal)}</div>
          </div>
          <span className={styles.rateHint}>السعر يتثبت 4 ساعات فور الطلب</span>
        </div>
      </div>

      <Link to="/products" className={styles.continueLink}>
        <ArrowRight size={14} />
        <span>إضافة أجهزة أو ملحقات أخرى</span>
      </Link>

      <div className={styles.bottomSpacer} />

      {/* Sticky Bottom Checkout Bar (Above Safe Area) */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInfo}>
          <span className={styles.stickyLabel}>المطلوب:</span>
          <span className={styles.stickyTotal}>{formatSdg(estimatedTotal)}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className={`${styles.checkoutBtn} btn-vivid`}
        >
          <span>متابعة تثبيت السعر والطلب</span>
          <ArrowLeft size={16} />
        </button>
      </div>
    </div>
  );
}
