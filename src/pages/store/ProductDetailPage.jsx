import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { formatSdg, formatAed, getProductImageUrl, getStockStatusInfo, getConditionLabel } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/Skeleton';
import ProductCard from '../../components/products/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { success } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setQuantity(1);

    productsApi.getProductDetail(slug)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data;
        setProduct(data);
        // Find primary image or first
        if (data.images && data.images.length > 0) {
          const primary = data.images.find((img) => img.is_primary) || data.images[0];
          setSelectedImage(primary.path);
        } else {
          setSelectedImage(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'تعذر العثور على الجهاز المطلوب');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)' }}>
          <Skeleton height="360px" borderRadius="var(--radius-lg)" />
          <div>
            <Skeleton width="40%" height="24px" style={{ marginBottom: 'var(--space-3)' }} />
            <Skeleton width="80%" height="36px" style={{ marginBottom: 'var(--space-4)' }} />
            <Skeleton width="50%" height="28px" style={{ marginBottom: 'var(--space-6)' }} />
            <Skeleton height="120px" borderRadius="var(--radius-md)" style={{ marginBottom: 'var(--space-4)' }} />
            <Skeleton width="100%" height="48px" borderRadius="var(--radius-md)" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <ErrorState
          title="الجهاز غير موجود"
          message={error || 'لم نتمكن من العثور على الجهاز المطلوب في المتجر.'}
          onRetry={() => navigate('/products')}
        />
      </div>
    );
  }

  const stock = getStockStatusInfo(product.stock_status);
  const condition = getConditionLabel(product.condition);
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const displayImage = getProductImageUrl(selectedImage);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    success(`تمت إضافة ${quantity} قطعة من "${product.name}" إلى السلة`);
  };

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', marginBottom: 'var(--space-6)' }}>
        <Link to="/">الرئيسية</Link>
        <span>/</span>
        <Link to="/products">الأجهزة والمنتجات</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/products?category=${product.category.slug}`}>{product.category.name_ar}</Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: 'var(--color-slate-800)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
        {/* Gallery Section */}
        <div>
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 340,
              maxHeight: 440,
              marginBottom: 'var(--space-3)',
            }}
          >
            <img
              src={displayImage}
              alt={product.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/favicon.svg';
              }}
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.path)}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedImage === img.path ? 'var(--color-royal-blue)' : 'var(--color-slate-200)'}`,
                    padding: 4,
                    backgroundColor: 'var(--color-white)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={getProductImageUrl(img.thumb_path || img.path)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Badge variant={stock.variant}>{stock.label}</Badge>
            <Badge variant="neutral">{condition}</Badge>
            {product.brand && <Badge variant="info">{product.brand.name}</Badge>}
            {product.is_featured && <Badge variant="navy">⭐ مميز</Badge>}
          </div>

          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', lineHeight: 1.3 }}>
            {product.name}
          </h1>

          {product.short_description && (
            <p style={{ color: 'var(--color-slate-600)', fontSize: 'var(--text-base)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              {product.short_description}
            </p>
          )}

          {/* Price Box */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--color-ice-blue-alt)',
              borderColor: '#CCE4FF',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-royal-blue)' }}>
                {formatSdg(product.price_sdg)}
              </span>
              {product.price_aed && (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)' }}>
                  (يعادل: {formatAed(product.price_aed)})
                </span>
              )}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', marginTop: 'var(--space-1)' }}>
              💡 يتم حجز وتثبيت السعر لمدة 4 ساعات عند تقديم الطلب
            </div>
          </div>

          {/* Warranty Info */}
          {product.warranty_text && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                border: '1px solid var(--color-success-border)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                marginBottom: 'var(--space-6)',
              }}
            >
              <span>🛡️</span>
              <span>الضمان المعتمد: {product.warranty_text}</span>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-slate-300)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: '1.25rem' }}
              >
                -
              </button>
              <span style={{ padding: '0 var(--space-3)', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={quantity >= 10 || isOutOfStock}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                style={{ padding: 'var(--space-2) var(--space-3)', fontSize: '1.25rem' }}
              >
                +
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              style={{ flex: 1 }}
            >
              {isOutOfStock ? 'الجهاز غير متوفر بالمخزن' : '🛒 إضافة إلى سلة الشراء'}
            </Button>
          </div>

          {/* Shop Location Note */}
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', borderTop: '1px solid var(--color-slate-200)', paddingTop: 'var(--space-4)' }}>
            📍 متوفر للاستلام الفوري من فرع أم درمان (مول الواحة)، أو التوصيل لكافة ولايات السودان.
          </div>
        </div>
      </div>

      {/* Specifications & Description Tabs/Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
        {/* Specs Table */}
        {product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>المواصفات الفنية للجهاز</h3>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <tbody>
                  {Object.entries(product.specs).map(([key, val]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, color: 'var(--color-navy)', width: '35%', backgroundColor: 'var(--color-slate-50)' }}>
                        {key === 'cpu' ? 'المعالج (CPU)' :
                         key === 'ram' ? 'الذاكرة العشوائية (RAM)' :
                         key === 'storage' ? 'سعة التخزين (Storage)' :
                         key === 'screen' ? 'الشاشة' :
                         key === 'gpu' ? 'كرت الشاشة (GPU)' : key}
                      </td>
                      <td className="en-text" style={{ color: 'var(--color-slate-800)' }}>
                        {String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Description */}
        {product.description && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>تفاصيل الاستخدام والفحص</h3>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-slate-700)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {product.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Accessories */}
      {product.accessories && product.accessories.length > 0 && (
        <section style={{ marginTop: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
            إكسسوارات وملحقات مقترحة لهذا الجهاز
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {product.accessories.map((acc) => (
              <ProductCard key={acc.id} product={acc} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
