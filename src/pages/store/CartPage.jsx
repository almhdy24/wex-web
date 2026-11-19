import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, X, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import Button from '../../components/common/Button';
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>سلة المشتريات</h1>
          <p className={styles.subTitle}>
            {totalItems} {totalItems === 1 ? 'جهاز' : 'أجهزة / منتجات'} في السلة
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className={styles.clearBtn}
        >
          <Trash2 size={14} />
          <span>إفراغ السلة</span>
        </button>
      </header>

      <div className={styles.layoutGrid}>
        {/* Cart Items List */}
        <div>
          <div className={styles.itemsCard}>
            {items.map((item) => {
              const imgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path);
              const lineTotal = (item.price_sdg || 0) * item.quantity;

              return (
                <div key={item.id} className={styles.itemRow}>
                  {/* Thumbnail */}
                  <Link
                    to={`/products/${item.slug || item.id}`}
                    className={styles.thumbLink}
                    tabIndex={-1}
                  >
                    <img
                      src={imgUrl}
                      alt={item.name}
                      className={styles.thumbImg}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/favicon.svg';
                      }}
                    />
                  </Link>

                  {/* Title & Price */}
                  <div className={styles.itemInfo}>
                    <Link
                      to={`/products/${item.slug || item.id}`}
                      className={styles.itemName}
                    >
                      {item.name}
                    </Link>
                    <span className={styles.unitPrice}>
                      سعر القطعة: {formatSdg(item.price_sdg)}
                    </span>
                  </div>

                  {/* Stepper */}
                  <div className={styles.stepper} aria-label="تعديل الكمية">
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="تقليل الكمية"
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.stepCount}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= 10}
                      aria-label="زيادة الكمية"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className={styles.totalCol}>
                    <span className={styles.lineTotal}>{formatSdg(lineTotal)}</span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={styles.removeBtn}
                    aria-label={`حذف ${item.name}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <Link to="/products" className={styles.continueLink}>
            <ArrowLeft size={16} />
            <span>متابعة تصفح المزيد من الأجهزة</span>
          </Link>
        </div>

        {/* Order Summary & Checkout Card */}
        <aside>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>ملخص السلة</h2>

            <div className={styles.summaryRow}>
              <span>عدد القطع:</span>
              <span>{totalItems}</span>
            </div>

            <div className={styles.summaryTotalRow}>
              <span>المجموع المبدئي:</span>
              <span className={styles.totalSdg}>
                {formatSdg(estimatedSubtotalSdg)}
              </span>
            </div>

            <div className={styles.noticeBox}>
              السعر بالدرهم وبيتغير مع الصرف. بنثبته ليك بعد الطلب مباشرة لمدة 4 ساعات.
            </div>

            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => navigate('/checkout')}
            >
              <span>متابعة إتمام الطلب</span>
              <ArrowLeft size={18} />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
