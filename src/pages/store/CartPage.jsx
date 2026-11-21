import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import { pluralAr } from '../../utils/pluralAr';
import { ProductImage } from '../../components/common';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import styles from './CartPage.module.css';

export function formatCartDevicesCount(count) {
  return pluralAr(count, {
    zero: 'لا توجد أجهزة',
    one: 'جهاز واحد',
    two: 'جهازان',
    few: 'أجهزة',
    many: 'جهازًا',
  });
}

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    totalItems,
    estimatedSubtotalSdg,
    refreshCartPrices,
  } = useCart();
  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    refreshCartPrices();
  }, [refreshCartPrices]);

  if (items.length === 0) {
    return (
      <Page className={styles.container}>
        <div className={styles.emptyCard}>
          <h1 className={styles.title}>السلة</h1>
          <p className={styles.emptyText}>السلة فارغة حاليًا.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            تصفّح الأجهزة
          </Button>
        </div>
      </Page>
    );
  }

  const discount = Math.round(estimatedSubtotalSdg * 0.03);
  const total = Math.max(0, estimatedSubtotalSdg - discount);

  const handleRemoveItem = (item) => {
    removeItem(item.id);
    success('تم حذف الجهاز من السلة');
  };

  return (
    <Page className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>السلة</h1>
      </header>

      {/* Items List */}
      <div className={styles.itemsList}>
        {items.map((item) => {
          const imgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path || item.image_url);
          const lineTotal = (item.price_sdg || 0) * item.quantity;

          return (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemImageContainer}>
                <ProductImage
                  src={imgUrl}
                  alt={item.name}
                  type={item.type || 'laptop'}
                  className={styles.itemImg}
                  fallbackClassName={styles.itemPlaceholder}
                />
              </div>

              <div className={styles.itemInfo}>
                <div className={styles.itemHeader}>
                  <Link to={`/products/${item.slug || item.id}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    className={styles.removeBtn}
                    aria-label={`حذف ${item.name}`}
                  >
                    <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.itemUnitPrice}>
                  {formatSdg(item.price_sdg)}
                </div>

                <div className={styles.itemFooter}>
                  <div className={styles.quantityStepper}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      aria-label="تقليل الكمية"
                    >
                      <Minus size={14} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <span className={styles.stepValue}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="زيادة الكمية"
                    >
                      <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </div>

                  <span className={styles.itemLineTotal}>{formatSdg(lineTotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Link to add other products */}
      <div className={styles.addMoreRow}>
        <Link to="/products" className={styles.addMoreLink}>
          <span>إضافة منتجات أخرى</span>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>

      {/* Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>
            المجموع ({formatCartDevicesCount(totalItems)})
          </span>
          <span className={styles.summaryValue}>{formatSdg(estimatedSubtotalSdg)}</span>
        </div>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>خصم التطبيق (3%)</span>
          <span className={styles.discountValue}>- {formatSdg(discount)}</span>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>الإجمالي</span>
          <span className={styles.totalValue}>{formatSdg(total)}</span>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className={styles.stickyBar}>
        <Button
          variant="primary"
          onClick={() => navigate('/checkout')}
          className={styles.checkoutBtn}
        >
          <span>متابعة</span>
          <span className={styles.stickyTotal}>({formatSdg(total)})</span>
        </Button>
      </div>
    </Page>
  );
}
