import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { formatSdg, formatAed } from '../../utils/formatters';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';

export default function HomePage() {
  const [shopInfo, setShopInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopRes, catsRes, featuredRes, latestRes, accRes] = await Promise.all([
        productsApi.getShopInfo(),
        productsApi.getCategories(),
        productsApi.getProducts({ featured: true, per_page: 4 }),
        productsApi.getProducts({ sort: 'newest', per_page: 4 }),
        productsApi.getProducts({ type: 'accessory', per_page: 4 }),
      ]);

      setShopInfo(shopRes?.data || null);
      setCategories(catsRes?.data || []);
      setFeaturedProducts(featuredRes?.data || []);
      setLatestProducts(latestRes?.data || []);
      setAccessories(accRes?.data || []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل بيانات الصفحة الرئيسية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--color-navy-dark) 0%, var(--color-navy) 60%, var(--color-royal-blue) 100%)',
          color: 'var(--color-white)',
          padding: 'var(--space-12) 0 var(--space-16)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 680 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                backgroundColor: 'rgba(0, 183, 255, 0.15)',
                border: '1px solid rgba(0, 183, 255, 0.3)',
                color: 'var(--color-cyan)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
              }}
            >
              <span>⚡</span>
              <span>سعر الصرف مثبت {shopInfo?.price_lock_hours || 4} ساعات عند الطلب</span>
            </div>

            <h1
              style={{
                fontSize: 'calc(var(--text-2xl) * 1.3)',
                color: 'var(--color-white)',
                lineHeight: 1.25,
                fontWeight: 800,
                marginBottom: 'var(--space-4)',
              }}
            >
              أجهزة لابتوب وهواتف ذكية أصلية في أم درمان
            </h1>

            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-slate-200)',
                lineHeight: 1.7,
                marginBottom: 'var(--space-6)',
              }}
            >
              متجر ويكس تكنولوجي (Wex Technology) يوفر لك أجهزة وارد دبي بأفضل المواصفات المعتمدة، مع فحص كامل وضمان المحل وسرعة التسليم في أم درمان وكافة ولايات السودان.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Link to="/products">
                <Button variant="primary" size="lg" style={{ backgroundColor: 'var(--color-cyan)', color: 'var(--color-navy)', fontWeight: 700 }}>
                  تصفح جميع الأجهزة
                </Button>
              </Link>
              <Link to="/products?type=laptop">
                <Button variant="outline" size="lg" style={{ color: 'var(--color-white)', borderColor: 'rgba(255,255,255,0.3)' }}>
                  لابتوبات الأعمال
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to top, var(--color-slate-50), transparent)',
          }}
        />
      </section>

      {/* Trust Badges */}
      <section style={{ transform: 'translateY(-24px)', marginBottom: 'var(--space-6)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '2rem' }}>🔒</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>تثبيت سعر الصرف</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>حجز السعر لمدة 4 ساعات لمنع تقلبات العملة</div>
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '2rem' }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ضمان المحل</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>فحص دقيق لكافة المنافذ والبطارية والشاشة</div>
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '2rem' }}>🚚</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>توصيل واستلام</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>استلام مباشر من أم درمان أو شحن للولايات</div>
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '2rem' }}>🏦</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>دفع بنكك معتمد</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)' }}>إشعار تحويل آمن ومباشر ومراجعة فورية</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="container">
          <ErrorState message={error} onRetry={loadHomeData} />
        </div>
      )}

      {/* Main Categories Section */}
      {categories.length > 0 && (
        <section style={{ padding: 'var(--space-8) 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>التصنيفات الرئيسية</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', margin: 0 }}>اختر التصنيف لتصفح الأجهزة المتاحة</p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="card card-hover"
                  style={{
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 110,
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
                    {cat.slug === 'laptops' ? '💻' : cat.slug === 'smartphones' ? '📱' : '🎧'}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 'var(--text-base)' }}>
                    {cat.name_ar}
                  </div>
                  {cat.name_en && (
                    <div className="en-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>
                      {cat.name_en}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section style={{ padding: 'var(--space-8) 0', backgroundColor: 'var(--color-slate-100)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>الأجهزة المختارة والمميزة</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', margin: 0 }}>أقوى العروض على اللابتوبات الأعلى كفاءة</p>
            </div>
            <Link to="/products?featured=true" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              عرض الكل ←
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((prod) => <ProductCard key={prod.id} product={prod} />)
            ) : (
              <p style={{ color: 'var(--color-slate-500)', gridColumn: '1 / -1' }}>لا توجد أجهزة مميزة حالياً</p>
            )}
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section style={{ padding: 'var(--space-8) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>وصل حديثاً للمتجر</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', margin: 0 }}>أحدث الأجهزة المضافة بالمخزون</p>
            </div>
            <Link to="/products?sort=newest" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              عرض الكل ←
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : latestProducts.length > 0 ? (
              latestProducts.map((prod) => <ProductCard key={prod.id} product={prod} />)
            ) : (
              <p style={{ color: 'var(--color-slate-500)', gridColumn: '1 / -1' }}>لا توجد منتجات حديثة</p>
            )}
          </div>
        </div>
      </section>

      {/* Accessories Section */}
      {accessories.length > 0 && (
        <section style={{ padding: 'var(--space-8) 0', backgroundColor: 'var(--color-ice-blue-alt)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>الملحقات والإكسسوارات</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-500)', margin: 0 }}>شواحن أصلية، ماوسات، وحقائب حماية</p>
              </div>
              <Link to="/products?type=accessory" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                عرض الكل ←
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {accessories.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop Info Section */}
      <section style={{ padding: 'var(--space-12) 0', backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          <div
            className="card"
            style={{
              padding: 'var(--space-8)',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                  متجر ويكس تكنولوجي — أم درمان
                </div>
                <p style={{ color: 'var(--color-slate-300)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                  يسعدنا استقبالكم في فرعنا بمول الواحة - الشهداء في أم درمان لتجربة الأجهزة واستلام طلباتكم مباشرة والتأكد من كافة المواصفات والضمان.
                </p>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <a
                    href="https://wa.me/249912345678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{ backgroundColor: '#25D366', color: '#FFFFFF', fontWeight: 700 }}
                  >
                    💬 استفسر عبر واتساب مباشرة
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.25rem' }}>📍</span>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>العنوان</div>
                    <div style={{ fontWeight: 600 }}>مول الواحة، الشهداء، أم درمان</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.25rem' }}>⏰</span>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>ساعات العمل</div>
                    <div style={{ fontWeight: 600 }}>من 10 صباحاً إلى 10 مساءً، عدا الجمعة</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.25rem' }}>💹</span>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)' }}>سعر الصرف المعتمد</div>
                    <div style={{ fontWeight: 600 }}>1 درهم = {shopInfo?.exchange_rate_sdg || 650} جنيه سوداني</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
