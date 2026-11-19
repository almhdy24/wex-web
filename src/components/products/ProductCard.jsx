import React from 'react';
import { Link } from 'react-router-dom';
import { formatSdg, formatAed, getProductImageUrl, getStockStatusInfo, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { success } = useToast();

  if (!product) return null;

  const stock = getStockStatusInfo(product.stock_status);
  const condition = getConditionLabel(product.condition);
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const imageUrl = getProductImageUrl(product.image?.thumb_path || product.image?.path);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
    success(`تمت إضافة "${product.name}" إلى السلة`);
  };

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-white)',
      }}
    >
      <Link
        to={`/products/${product.slug}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {/* Image Container with Badges */}
        <div
          style={{
            position: 'relative',
            paddingTop: '65%',
            backgroundColor: 'var(--color-slate-100)',
            overflow: 'hidden',
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/favicon.svg';
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: 'var(--space-3)',
              transition: 'transform 0.2s ease',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'var(--space-2)',
              right: 'var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              alignItems: 'flex-end',
            }}
          >
            <Badge variant={stock.variant}>{stock.label}</Badge>
            {product.is_featured && (
              <Badge variant="navy" style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-white)' }}>
                ⭐ مميز
              </Badge>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 'var(--space-2)',
              right: 'var(--space-2)',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                color: 'var(--color-slate-700)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                backdropFilter: 'blur(2px)',
              }}
            >
              {condition}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--color-navy)',
              marginBottom: 'var(--space-1)',
              lineHeight: 1.4,
            }}
          >
            {product.name}
          </h3>

          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-500)',
              lineHeight: 1.5,
              marginBottom: 'var(--space-3)',
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.short_description || 'أجهزة إلكترونية أصلية معتمدة من ويكس تكنولوجي'}
          </p>

          {/* Pricing */}
          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-slate-100)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 800,
                    color: 'var(--color-royal-blue)',
                  }}
                >
                  {formatSdg(product.price_sdg)}
                </span>
                {product.price_aed && (
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>
                    السعر المرجعي: {formatAed(product.price_aed)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Footer */}
      <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        <Button
          variant={isOutOfStock ? 'outline' : 'primary'}
          size="sm"
          block
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? 'نفد من المخزن' : '🛒 أضف إلى السلة'}
        </Button>
      </div>
    </div>
  );
}
