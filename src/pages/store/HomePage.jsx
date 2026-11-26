import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Laptop,
  Smartphone,
  Headphones,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Heart,
  ShoppingCart,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { shopApi } from '../../api/shop';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import BrandRibbons from '../../components/common/BrandRibbons';
import { Reveal, Stagger } from '../../motion';
import { formatPriceUpdateCaption } from '../../utils/formatters';
import { normalizeShopInfo, buildWhatsAppLink, DEFAULT_MAP_LINK } from '../../utils/shopSettings';
import styles from './HomePage.module.css';


// Home section (admin) -> product list query. Sources: newest | type | category | featured.
function homeSectionQuery(sec) {
  const value = (sec?.source_value || '').trim();
  switch (sec?.source) {
    case 'type':
      return value ? { type: value } : { sort: 'newest' };
    case 'category':
      return value ? { category: value } : { sort: 'newest' };
    case 'featured':
      return { featured: 1 };
    default:
      return { sort: 'newest' };
  }
}

// Slide links are admin input: only same-site paths navigate; anything else goes to the catalog.
function safeInternalPath(link) {
  const l = String(link || '').trim();
  return l.startsWith('/') && !l.startsWith('//') && !l.startsWith('/\\') ? l : '/products';
}

export default function HomePage({
  initialLoading = true,
  initialShopInfo = null,
  initialProducts = [],
} = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { favoriteCount } = useFavorites();

  const [shopInfo, setShopInfo] = useState(() => (initialShopInfo ? normalizeShopInfo(initialShopInfo) : null));
  const [products, setProducts] = useState(initialProducts);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  // Admin-managed content (hero slides, home sections) was never read by the storefront.
  const [adminSlides, setAdminSlides] = useState([]);
  const [homeSections, setHomeSections] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [shopRes, prodsRes, brandsRes, slidesRes, sectionsRes] = await Promise.all([
          shopApi.getShop().catch(() => null),
          productsApi.getProducts({ per_page: 24 }).catch(() => ({ data: [] })),
          productsApi.getBrands().catch(() => ({ data: [] })),
          productsApi.getHeroSlides().catch(() => ({ data: [] })),
          productsApi.getHomeSections().catch(() => ({ data: [] })),
        ]);
        const activeSections = (Array.isArray(sectionsRes?.data) ? sectionsRes.data : [])
          .filter((sec) => sec && sec.is_active !== false && sec.is_active !== 0)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const sectionsWithProducts = await Promise.all(
          activeSections.map(async (sec) => {
            const query = homeSectionQuery(sec);
            const res = await productsApi.getProducts({ ...query, per_page: sec.limit || 8 }).catch(() => ({ data: [] }));
            return { ...sec, query, products: Array.isArray(res?.data) ? res.data : [] };
          })
        );
        if (isMounted) {
          setShopInfo(shopRes?.data ? normalizeShopInfo(shopRes.data) : null);
          setProducts(prodsRes?.data || []);
          setBrands(Array.isArray(brandsRes?.data) ? brandsRes.data : []);
          setAdminSlides(
            (Array.isArray(slidesRes?.data) ? slidesRes.data : [])
              .filter((sl) => sl && sl.is_active !== false && sl.is_active !== 0 && sl.title)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          );
          setHomeSections(sectionsWithProducts.filter((sec) => sec.products.length > 0));
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'تعذر تحميل بيانات المتجر');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const lockHours = shopInfo?.lock_hours || 4;

  const builtInSlides = [
    {
      title: 'أجهزة لابتوب جديدة ومستعملة',
      text: 'تصفّح الأجهزة المتوفرة بأسعار واضحة.',
      buttonLabel: 'تصفّح الأجهزة',
      action: () => navigate('/products'),
    },
    {
      title: 'ثبّت السعر عند الطلب',
      text: `بعد تأكيد الطلب يبقى السعر ثابتًا لمدة ${lockHours} ساعات لتتمكّن من التحويل.`,
      buttonLabel: 'طريقة الطلب',
      action: () => {
        const el = document.getElementById('how-to-order');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      title: 'ملحقات الحاسوب',
      text: 'اختر ما يلزم جهازك من الملحقات.',
      buttonLabel: 'تصفّح الملحقات',
      action: () => navigate('/products?type=accessory'),
    },
  ];

  // Admin slides when any are active; the built-in three otherwise.
  const slides = adminSlides.length > 0
    ? adminSlides.map((sl) => ({
      title: sl.title,
      text: sl.subtitle || '',
      buttonLabel: sl.button_label || 'تصفّح الأجهزة',
      action: () => navigate(safeInternalPath(sl.link)),
    }))
    : builtInSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <Page className={styles.container}>
        <div className={styles.loadingSkeleton}>
          <div className={styles.heroSkeleton} />
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((n) => (
              <ProductCardSkeleton key={n} />
            ))}
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page className={styles.container}>
        <ErrorState
          title="تعذّر الاتصال"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </Page>
    );
  }

  const distinctProducts = Array.from(
    new Map((products || []).map((p) => [p.id, p])).values()
  );
  const newArrivals = distinctProducts.slice(0, 6);
  const featuredList = distinctProducts.filter((p) => p.is_featured);
  const featuredProducts = (featuredList.length > 0 ? featuredList : distinctProducts).slice(0, 6);
  const ordersDisabled = shopInfo?.orders_enabled === false || shopInfo?.orders_enabled === '0';

  const whatsappUrl = buildWhatsAppLink(shopInfo?.whatsapp, 'مرحباً، أود الاستفسار عن متجر ويكس تكنولوجي');

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Hero block (navy) containing: logo chip + cart/fav buttons, greeting, title, subtitle, CTA, dots */}
      <section className={styles.heroBlock} aria-label="العروض الرئيسية">
        <BrandRibbons variant="hero" />

        {/* Top row: Logo Chip on start side, glass Cart / Fav buttons on end side */}
        <div className={styles.heroTopRow}>
          <Link to="/" className={styles.logoChip} aria-label="ويكس تكنولوجي">
            <img
              src="/assets/logo.png"
              alt="ويكس تكنولوجي"
              className={styles.logoImg}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>

          <div className={styles.heroActions}>
            <Link
              to="/favorites"
              className={styles.heroActionBtn}
              aria-label="المفضلة"
            >
              <Heart size={22} strokeWidth={1.75} />
              {favoriteCount > 0 && (
                <span className={styles.actionBadge}>
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className={styles.heroActionBtn}
              aria-label="السلة"
            >
              <ShoppingCart size={22} strokeWidth={1.75} />
              {totalItems > 0 && (
                <span className={styles.actionBadge}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Greeting: Never show admin/staff names to storefront */}
        <p className={styles.greeting}>
          {(user && user.role !== 'admin' && user.role !== 'staff' && user.role !== 'super_admin' && user.name)
            ? `مرحبًا، ${user.name.trim().split(/\s+/)[0]}`
            : 'مرحبًا بك'}
        </p>

        {/* Slide Title */}
        <h2 key={`title-${activeSlide}`} className={styles.slideTitle}>{slides[activeSlide].title}</h2>

        {/* Slide Subtitle */}
        <p key={`sub-${activeSlide}`} className={styles.slideSubtitle}>{slides[activeSlide].text}</p>

        {/* Slide CTA */}
        <button
          type="button"
          onClick={slides[activeSlide].action}
          className={styles.slideCta}
        >
          <span>{slides[activeSlide].buttonLabel}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>

        {/* Dots */}
        <div className={styles.dots} role="tablist" aria-label="شرائح العرض">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeSlide === idx}
              aria-label={`الشريحة ${idx + 1}`}
              className={`${styles.dot} ${activeSlide === idx ? styles.dotActive : ''}`}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>
      </section>

      <Page padded={false} className={styles.container}>
        {/* 2. Search field (overlapping the hero) */}
      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
        <div className={styles.searchContainer}>
          <Search size={22} strokeWidth={2} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن جهاز أو ماركة"
            className={styles.searchInput}
            aria-label="ابحث عن جهاز أو ماركة"
          />
        </div>
      </form>

      {/* 3. "آخر تحديث للأسعار" / Orders-disabled strip */}
      <Reveal>
        {ordersDisabled && (
          <div className={styles.ordersDisabledStrip} role="status">
            {shopInfo?.orders_disabled_message || 'استقبال الطلبات متوقف مؤقتاً في الوقت الحالي.'}
          </div>
        )}
        <div className={styles.priceUpdateLine}>
          <span className={styles.priceDot} aria-hidden="true" />
          <span className={styles.priceUpdateCaption}>
            آخر تحديث للأسعار: {formatPriceUpdateCaption(shopInfo?.prices_updated_at)}
          </span>
        </div>
      </Reveal>

      {/* 4. Category tiles (3) */}
      <Reveal>
        <section className={styles.categoryTiles} aria-label="أقسام المتجر">
          <Link to="/products?type=laptop" className={styles.categoryTile}>
            <div className={styles.categoryIconWell}>
              <Laptop size={28} strokeWidth={1.75} />
            </div>
            <span className={styles.categoryLabel}>الحواسيب</span>
          </Link>

          <Link to="/products?type=phone" className={styles.categoryTile}>
            <div className={styles.categoryIconWell}>
              <Smartphone size={28} strokeWidth={1.75} />
            </div>
            <span className={styles.categoryLabel}>الهواتف</span>
          </Link>

          <Link to="/products?type=accessory" className={styles.categoryTile}>
            <div className={styles.categoryIconWell}>
              <Headphones size={28} strokeWidth={1.75} />
            </div>
            <span className={styles.categoryLabel}>الملحقات</span>
          </Link>
        </section>
      </Reveal>

      {/* 5. Admin home sections (order, titles, sources from /admin/home-sections); the
          built-in rows only when none are configured. */}
      {homeSections.length > 0 ? (
        homeSections.map((sec) => (
          <section key={sec.id || sec.key} className={styles.featuredSection} aria-label={sec.title} data-home-section="products">
            <Reveal>
              <div className={styles.featuredHeader}>
                <h2 className={styles.featuredTitle}>{sec.title}</h2>
                <Link to={`/products?${new URLSearchParams(sec.query).toString()}`} className={styles.featuredLink}>
                  <span>عرض الكل</span>
                  <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Stagger className={styles.featuredGrid}>
              {sec.products.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </Stagger>
          </section>
        ))
      ) : (
        <>
      {/* 5a. "وصل حديثاً" horizontal product row */}
      {newArrivals.length > 0 && (
        <section className={styles.featuredSection} aria-label="وصل حديثاً" data-home-section="products">
          <Reveal>
            <div className={styles.featuredHeader}>
              <h2 className={styles.featuredTitle}>وصل حديثاً</h2>
              <Link to="/products?sort=newest" className={styles.featuredLink}>
                <span>عرض الكل</span>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <div className={styles.horizontalRow}>
            {newArrivals.map((product, idx) => (
              <div key={product.id} className={styles.horizontalCard}>
                <ProductCard product={product} index={idx} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5b. "مختارات المتجر" grid */}
      {featuredProducts.length > 0 && (
        <section className={styles.featuredSection} aria-label="مختارات المتجر" data-home-section="products">
          <Reveal>
            <div className={styles.featuredHeader}>
              <h2 className={styles.featuredTitle}>مختارات المتجر</h2>
              <Link to="/products" className={styles.featuredLink}>
                <span>عرض الكل</span>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <Stagger className={styles.featuredGrid}>
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </Stagger>
        </section>
      )}

        </>
      )}

      {/* 5c. Brands row */}
      {brands.length > 0 && (
        <section className={styles.brandsSection} aria-label="الماركات">
          <div className={styles.featuredHeader}>
            <h2 className={styles.featuredTitle}>الماركات</h2>
          </div>
          <div className={styles.brandsRow}>
            {brands.map((b) => (
              <Link key={b.id} to={`/products?brand=${b.slug || b.id}`} className={styles.brandChip}>
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. "طريقة الطلب" navy panel (3 concise steps) */}
      <Reveal>
        <section id="how-to-order" className={styles.howToOrderPanel} aria-label="طريقة الطلب">
          <BrandRibbons variant="panel" />
          <div className={styles.howToOrderContent}>
            <h2 className={styles.howToOrderTitle}>طريقة الطلب</h2>
            <div className={styles.howToOrderSteps}>
              <div className={styles.howToOrderStep}>
                <div className={styles.stepIndicatorCol}>
                  <span className={styles.stepNumCircle}>1</span>
                  <span className={styles.stepConnector} />
                </div>
                <p className={styles.stepText}>اختر الجهاز وأكّد الطلب لتثبيت السعر</p>
              </div>

              <div className={styles.howToOrderStep}>
                <div className={styles.stepIndicatorCol}>
                  <span className={styles.stepNumCircle}>2</span>
                  <span className={styles.stepConnector} />
                </div>
                <p className={styles.stepText}>حوّل المبلغ وارفع إشعار التحويل البنكي</p>
              </div>

              <div className={styles.howToOrderStep}>
                <div className={styles.stepIndicatorCol}>
                  <span className={styles.stepNumCircle}>3</span>
                </div>
                <p className={styles.stepText}>استلم طلبك من المحل أو عبر التوصيل</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* 7. Store info card */}
      <Reveal>
        <section className={styles.storeInfoCard} aria-label="معلومات المتجر">
          <div className={styles.storeTopBand}>
            <BrandRibbons variant="header" />
            <div className={styles.storeTopBandContent}>
              <h2 className={styles.storeName}>{shopInfo?.name || 'ويكس تكنولوجي'}</h2>
              <p className={styles.storeTagline}>فريق ويكس في خدمتكم في المتجر بأم درمان</p>
            </div>
          </div>

          <div className={styles.storeBody}>
            <p className={styles.storeAddress}>
              {shopInfo?.address || 'مول الواحة، الشهداء، أم درمان'}
            </p>
            <div className={styles.storeHours}>
              {/* Admin "working hours" text only (a hard-coded 'الجمعة: مغلق' line contradicted it). */}
              <p>{shopInfo?.workingHours || 'السبت - الخميس: 9:00 ص - 9:00 م'}</p>
            </div>

            <div className={styles.storeButtons}>
              <a
                href={shopInfo?.mapLink || DEFAULT_MAP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storeBtnPrimary}
              >
                <MapPin size={18} strokeWidth={2} aria-hidden="true" />
                <span>الموقع على الخريطة</span>
              </a>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.storeBtnOutline}
                >
                  <MessageCircle size={18} strokeWidth={2} aria-hidden="true" />
                  <span>تواصل عبر واتساب</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </Reveal>
    </Page>
    </div>
  );
}
