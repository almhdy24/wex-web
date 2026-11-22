import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import { pluralAr } from '../../utils/pluralAr';
import { useCountUp } from '../../motion';
import { ProductTypeSvg } from '../../components/common';
import AppBar from '../../components/common/AppBar';
import BrandRibbons from '../../components/common/BrandRibbons';
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
    addItem,
    updateQuantity,
    removeItem,
    totalItems,
    estimatedSubtotalSdg,
    refreshCartPrices,
  } = useCart();
  const { success } = useToast();
  const navigate = useNavigate();

  const discount = Math.round(estimatedSubtotalSdg * 0.03);
  const total = Math.max(0, estimatedSubtotalSdg - discount);
  const [animatedTotal, countUpRef] = useCountUp(total, 600);

  useEffect(() => {
    refreshCartPrices();
  }, [refreshCartPrices]);

  if (items.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <AppBar
          tone="navy"
          style={{ '--header-bottom': '36px' }}
          title="السلة"
          showBack={true}
          showCart={false}
        />
        <Page className={styles.container}>
          <div className={styles.emptyCard}>
            <h1 className={styles.emptyTitle}>السلة</h1>
            <p className={styles.emptyText}>السلة فارغة حاليًا.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              تصفّح الأجهزة
            </Button>
          </div>
        </Page>
      </div>
    );
  }

  const handleRemoveItem = (item) => {
    removeItem(item.id);
    success({
      title: 'تم حذف الجهاز من السلة',
      action: {
        label: 'تراجع',
        onClick: () => addItem(item, item.quantity),
      },
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <AppBar
        tone="navy"
        style={{ '--header-bottom': '36px' }}
        title="السلة"
        showBack={true}
        showCart={false}
        customAction={
          <span className={styles.headerItemCountPill}>
            {formatCartDevicesCount(totalItems)}
          </span>
        }
      />

      <Page className={styles.container}>
        {/* Items List */}
        <div className={styles.itemsList}>
          {items.map((item) => {
            const rawImgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path || item.image_url);
            const hasRealImage = rawImgUrl && !rawImgUrl.includes('favicon.svg');
            const lineTotal = (item.price_sdg || 0) * item.quantity;
            const maxStock = item.stock_quantity !== undefined && item.stock_quantity !== null
              ? Math.min(10, Math.max(1, Number(item.stock_quantity)))
              : 10;
            const isMaxReached = item.quantity >= maxStock;

            return (
              <div key={item.id} className={styles.itemCard}>
                {/* 92x92 Thumbnail */}
                <div className={styles.thumbnailStage}>
                  <BrandRibbons variant="tile" />
                  {hasRealImage ? (
                    <img
                      src={rawImgUrl}
                      alt={item.name}
                      className={styles.thumbnailImg}
                    />
                  ) : (
                    <div className={styles.thumbnailPlaceholder}>
                      <ProductTypeSvg type={item.type || 'laptop'} />
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className={styles.itemRightCol}>
                  <div className={styles.itemTopRow}>
                    <Link to={`/products/${item.slug || item.id}`} className={styles.itemName} dir="auto">
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className={styles.deleteBtn}
                      aria-label={`حذف ${item.name}`}
                    >
                      <Trash2 size={18} strokeWidth={1.9} aria-hidden="true" />
                    </button>
                  </div>

                  {item.quantity > 1 && (
                    <div className={styles.unitPriceRow}>
                      <span className={styles.unitPrice}>{formatSdg(item.price_sdg)}</span>
                      {item.stock_quantity !== undefined && item.stock_quantity !== null && item.stock_quantity <= 3 && item.stock_quantity > 0 && (
                        <span className={styles.stockNotice}> (متبقي {item.stock_quantity} فقط)</span>
                      )}
                    </div>
                  )}

                  <div className={styles.itemBottomRow}>
                    {/* Stepper */}
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        className={styles.stepperMinusBtn}
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        aria-label="تقليل الكمية"
                      >
                        <Minus size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                      <span className={styles.stepperCount}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.stepperPlusBtn}
                        disabled={isMaxReached}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="زيادة الكمية"
                        title={isMaxReached ? `أقصى كمية متوفرة (${maxStock})` : 'زيادة الكمية'}
                      >
                        <Plus size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>

                    {/* Line price */}
                    <div className={styles.linePrice}>
                      <span className={styles.linePriceNum}>
                        {Number(lineTotal).toLocaleString('en-US')}
                      </span>
                      <span className={styles.linePriceCur}>ج.س</span>
                      <span className={styles.srOnly}>{formatSdg(lineTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to add other products */}
        <Link to="/products" className={styles.addMoreLink}>
          <span>إضافة منتجات أخرى</span>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>

        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              المجموع ({formatCartDevicesCount(totalItems)})
            </span>
            <span className={styles.summaryValue}>
              <span className={styles.srOnly}>{formatSdg(estimatedSubtotalSdg)}</span>
              <span>{Number(estimatedSubtotalSdg).toLocaleString('en-US')} ج.س</span>
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>خصم التطبيق (3%)</span>
            <span className={styles.discountPill}>- {formatSdg(discount)}</span>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>الإجمالي</span>
            <div className={styles.totalValueCol} ref={countUpRef}>
              <span className={styles.totalNum} aria-hidden="true">
                {Number(animatedTotal).toLocaleString('en-US')}
              </span>
              <span className={styles.totalCur} aria-hidden="true">ج.س</span>
              <span className={styles.srOnly}>{formatSdg(total)}</span>
            </div>
          </div>
        </div>

        {/* Price notice */}
        <div className={styles.priceNoticeRow}>
          <Info size={18} strokeWidth={1.75} className={styles.noticeIcon} aria-hidden="true" />
          <span>السعر قابل للتغيير حتى تأكيد الطلب.</span>
        </div>

        {/* Fixed Bottom Bar */}
        <div className={styles.fixedBottomBar}>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className={styles.checkoutBtn}
          >
            <span>متابعة</span>
            <span className={styles.stickyTotal}>({formatSdg(total)})</span>
          </button>
        </div>
      </Page>
    </div>
  );
}
