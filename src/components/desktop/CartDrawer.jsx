import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Drawer from '../common/Drawer';
import LaptopSvg from '../common/LaptopSvg';
import { useCart } from '../../context/CartContext';
import { formatSdg } from '../../utils/formatters';
import { ar } from '../../content/ar';
import styles from './CartDrawer.module.css';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useCartNavigate(onClose);
  const { items, updateQuantity, removeItem, estimatedSubtotalSdg, totalItems } = useCart();

  const discount = Math.round(estimatedSubtotalSdg * 0.03);
  const finalTotal = Math.max(0, estimatedSubtotalSdg - discount);

  const handleCheckout = () => {
    onClose?.();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose?.();
    navigate('/cart');
  };

  const handleBrowse = () => {
    onClose?.();
    navigate('/products');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${ar.desktop.cartDrawerTitle} (${totalItems})`}
      position="end"
      width="440px"
      id="cart-side-drawer"
    >
      <div className={styles.container}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <ShoppingBag size={48} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>{ar.desktop.cartEmpty}</h3>
            <p className={styles.emptyDesc}>أضف الأجهزة والملحقات التي ترغب بها إلى سلتك للمتابعة.</p>
            <button
              type="button"
              className={styles.browseBtn}
              onClick={handleBrowse}
            >
              {ar.desktop.continueShopping}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemImageWrapper}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.itemImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.fallbackSvgBox}>
                        <LaptopSvg width={46} height={32} />
                      </div>
                    )}
                  </div>

                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <div className={styles.itemPrice}>
                      {formatSdg(item.price_sdg)}
                    </div>

                    <div className={styles.actionsRow}>
                      <div className={styles.quantityStepper}>
                        <button
                          type="button"
                          className={styles.stepBtn}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="تقليل الكمية"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.stepValue}>{item.quantity}</span>
                        <button
                          type="button"
                          className={styles.stepBtn}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="زيادة الكمية"
                          disabled={item.quantity >= 10}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.id)}
                        aria-label="حذف الجهاز من السلة"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footerSummary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>{ar.desktop.cartSubtotal}</span>
                <span className={styles.summaryValue}>{formatSdg(estimatedSubtotalSdg)}</span>
              </div>

              {discount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span className={styles.summaryLabel}>{ar.desktop.appDiscount}</span>
                  <span className={styles.discountValue}>- {formatSdg(discount)}</span>
                </div>
              )}

              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span className={styles.totalLabel}>{ar.desktop.cartTotal}</span>
                <span className={styles.totalValue}>{formatSdg(finalTotal)}</span>
              </div>

              <div className={styles.ctaGroup}>
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                >
                  <span>{ar.desktop.proceedCheckout}</span>
                  <ArrowLeft size={18} />
                </button>

                <button
                  type="button"
                  className={styles.viewCartBtn}
                  onClick={handleViewCart}
                >
                  {ar.desktop.viewFullCart}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

// Helper hook for smooth navigation
function useCartNavigate() {
  const navigate = useNavigate();
  return navigate;
}
