import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatSdg, getProductImageUrl } from '../../utils/formatters';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalItems, estimatedSubtotalSdg } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) var(--space-4)' }}>
        <EmptyState
          title="سلة المشتريات فارغة"
          description="لم تقم بإضافة أي أجهزة أو ملحقات إلى السلة بعد. تصفح أحدث أجهزة اللابتوب والهواتف واختر ما يناسبك."
          actionLabel="تصفح الأجهزة الآن"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>سلة المشتريات</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
            لديك {totalItems} {totalItems === 1 ? 'جهاز' : 'أجهزة / منتجات'} في السلة
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          style={{
            color: 'var(--color-danger)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          🗑️ إفراغ السلة
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-6)' }}>
        {/* Cart Items List */}
        <div style={{ gridColumn: 'span 8' }} className="cart-items-col">
          <div className="card" style={{ padding: 0 }}>
            {items.map((item, index) => {
              const imgUrl = getProductImageUrl(item.image?.thumb_path || item.image?.path);
              const lineTotal = (item.price_sdg || 0) * item.quantity;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    borderBottom: index < items.length - 1 ? '1px solid var(--color-slate-100)' : 'none',
                  }}
                >
                  {/* Thumb */}
                  <Link
                    to={`/products/${item.slug}`}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-slate-100)',
                      padding: 4,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={item.name}
                      onError={(e) => { e.target.src = '/favicon.svg'; }}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </Link>

                  {/* Title & Price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/products/${item.slug}`}
                      style={{
                        fontWeight: 700,
                        color: 'var(--color-navy)',
                        fontSize: 'var(--text-sm)',
                        display: 'block',
                        marginBottom: 'var(--space-1)',
                        textDecoration: 'none',
                      }}
                    >
                      {item.name}
                    </Link>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>
                      سعر القطعة: {formatSdg(item.price_sdg)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-md)' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ padding: '2px 8px', minHeight: 'unset', fontSize: '1rem' }}
                      aria-label="تقليل الكمية"
                    >
                      -
                    </button>
                    <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= 10}
                      style={{ padding: '2px 8px', minHeight: 'unset', fontSize: '1rem' }}
                      aria-label="زيادة الكمية"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{ minWidth: 100, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-royal-blue)', fontSize: 'var(--text-sm)' }}>
                      {formatSdg(lineTotal)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-slate-400)',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '1.1rem',
                    }}
                    aria-label="حذف المنتج من السلة"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/products" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              ← متابعة تصفح المزيد من الأجهزة
            </Link>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div style={{ gridColumn: 'span 4' }} className="cart-summary-col">
          <div className="card" style={{ padding: 'var(--space-5)', position: 'sticky', top: 'calc(var(--header-height) + 16px)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
              ملخص السلة الاسترشادي
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--color-slate-600)' }}>عدد القطع:</span>
              <span style={{ fontWeight: 600 }}>{totalItems}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--color-slate-600)' }}>المجموع المبدئي:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-royal-blue)' }}>{formatSdg(estimatedSubtotalSdg)}</span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-ice-blue)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-navy)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-4)',
              }}
            >
              💡 <strong>تنبيه:</strong> الحسابات الرسمية وخصم التطبيق المعتمد (3%) ورسوم التوصيل يتم تثبيتها بواسطة خادم ويكس تكنولوجي عند الانتقال للدفع.
            </div>

            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => navigate('/checkout')}
            >
              الانتقال إلى إتمام الطلب ←
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cart-items-col, .cart-summary-col {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}
