import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import { getProductUrl } from '../../utils/productUrl';
import { pluralAr } from '../../utils/pluralAr';
import { normalizeShopInfo } from '../../utils/shopSettings';
import { productsApi } from '../../api/products';
import { swrCache } from '../../utils/swrCache';
import { useCountUp } from '../../motion';
import { ProductTypeSvg } from '../../components/common';
import AppBar from '../../components/common/AppBar';
import BrandRibbons from '../../components/common/BrandRibbons';
import Button from '../../components/common/Button';
import Page from '../../components/common/Page';
import Price from '../../components/common/Price';
import EmptyState from '../../components/common/EmptyState';
import NoticeLine from '../../components/common/NoticeLine';
import StickyBar from '../../components/common/StickyBar';
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
    hasUnconfirmedPriceChanges,
    confirmAllPriceChanges,
  } = useCart();
  const { success } = useToast();
  const navigate = useNavigate();

  const discount = Math.round(estimatedSubtotalSdg * 0.03);
  const total = Math.max(0, estimatedSubtotalSdg - discount);
  const [animatedTotal, countUpRef] = useCountUp(total, 600);

  const [shopInfo, setShopInfo] = useState(() => {
    const cached = swrCache.get('shop_info');
    return cached?.data ? normalizeShopInfo(cached.data) : null;
  });

  useEffect(() => {
    refreshCartPrices();
    let isMounted = true;
    productsApi.getShopInfo()
      .then((res) => {
        if (isMounted && res?.data) {
          const info = normalizeShopInfo(res.data);
          setShopInfo(info);
          swrCache.set('shop_info', info);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [refreshCartPrices]);

  if (items.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <AppBar
          tone="navy"
          overlap={36}
          title="السلة"
          showBack={true}
          showCart={false}
        />
        <Page className={styles.container}>
          <EmptyState
            title="السلة فارغة حاليًا."
            action={
              <Button variant="primary" onClick={() => navigate('/products')}>
                تصفّح الأجهزة
              </Button>
            }
          />
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
        overlap={36}
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
        <div className={styles.itemsCol}>
        {/* Items List */}
        <div className={styles.itemsList}>
          {items.map((item) => {
            const rawImgUrl = getProductImageUrl(
              item.thumb_url ||
              item.primary_image ||
              item.image?.thumb_path ||
              item.image?.path ||
              item.image_url
            );
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
                    <Link to={getProductUrl(item)} className={styles.itemName} dir="auto">
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

                  <div className={styles.unitPriceRow}>
                    {item.quantity > 1 && (
                      <span className={styles.unitPrice}>{formatSdg(item.price_sdg)}</span>
                    )}
                    {item.stock_quantity !== undefined && item.stock_quantity !== null && item.stock_quantity <= 3 && item.stock_quantity > 0 && (
                      <span className={styles.stockNotice}> (متبقي {item.stock_quantity} فقط)</span>
                    )}
                  </div>

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
                      <Price value={lineTotal} size="sm" tone="navy" />
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

        {/* Price change notice if detected */}
        {hasUnconfirmedPriceChanges && (
          <div className={styles.priceChangeBanner}>
            <NoticeLine variant="warning">
              تم تحديث بعض الأسعار وفقًا لأحدث البيانات المتوفرة.
            </NoticeLine>
            <button
              type="button"
              onClick={confirmAllPriceChanges}
              className={styles.confirmPriceChangesBtn}
            >
              فهمت
            </button>
          </div>
        )}

        </div>

        {/* Desktop: summary + checkout action in a side column */}
        <aside className={styles.summaryAside} aria-label="ملخص السلة">
        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              المجموع ({formatCartDevicesCount(totalItems)})
            </span>
            <span className={styles.summaryValue}>
              <Price value={estimatedSubtotalSdg} size="md" tone="navy" />
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>خصم التطبيق (3%)</span>
            <span className={styles.discountPill}>
              - <Price value={discount} size="md" tone="success" />
            </span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>رسوم التوصيل</span>
            <span className={styles.deliveryFeeEstimate}>تُحسب في الخطوة التالية</span>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>الإجمالي</span>
            <div className={styles.totalValueCol} ref={countUpRef}>
              <Price value={animatedTotal} size="lg" tone="royal" />
            </div>
          </div>
        </div>

        {/* Price notice */}
        <NoticeLine variant="secondary" className={styles.priceNoticeRow}>
          السعر قابل للتغيير حتى تأكيد الطلب.
        </NoticeLine>

        {shopInfo?.orders_enabled === false && (
          <NoticeLine variant="warning" className={styles.priceNoticeRow}>
            {shopInfo?.orders_disabled_message || 'استقبال الطلبات متوقف مؤقتاً في الوقت الحالي.'}
          </NoticeLine>
        )}

        {/* Fixed Bottom Bar */}
        <StickyBar>
          <button
            type="button"
            disabled={shopInfo?.orders_enabled === false}
            onClick={() => {
              if (shopInfo?.orders_enabled === false) return;
              navigate('/checkout');
            }}
            className={styles.checkoutBtn}
          >
            {shopInfo?.orders_enabled === false ? (
              <span>استقبال الطلبات متوقف مؤقتاً</span>
            ) : (
              <>
                <span>متابعة</span>
                <span className={styles.stickyTotal}>(<Price value={total} tone="inherit" size="sm" />)</span>
              </>
            )}
          </button>
        </StickyBar>
        </aside>
      </Page>
    </div>
  );
}
