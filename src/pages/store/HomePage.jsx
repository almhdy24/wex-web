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
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { shopApi } from '../../api/shop';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Page from '../../components/common/Page';
import ProductTypeSvg from '../../components/common/ProductTypeSvg';
import { formatPriceUpdateCaption } from '../../utils/formatters';
import styles from './HomePage.module.css';

export default function HomePage({
  initialLoading = true,
  initialShopInfo = null,
  initialProducts = [],
} = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shopInfo, setShopInfo] = useState(initialShopInfo);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [shopRes, prodsRes] = await Promise.all([
          shopApi.getShop().catch(() => null),
          productsApi.getProducts({ per_page: 24 }).catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          setShopInfo(shopRes?.data || null);
          setProducts(prodsRes?.data || []);
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

  // Search handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const lockHours = shopInfo?.lock_hours || 4;

  // Hero Slides Deck
  const slides = [
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

  // Auto slide interval
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
          <div className={styles.searchSkeleton} />
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

  // Filtered Product Lists for sections
  const newArrivals = products.slice(0, 4);
  const studyProducts = products
    .filter((p) => p.type === 'laptop' || (p.category_name && p.category_name.includes('دراسة')))
    .slice(0, 4);
  const workProducts = products
    .filter((p) => p.type === 'laptop' || (p.category_name && p.category_name.includes('عمل')))
    .slice(0, 4);
  const accessoryProducts = products
    .filter((p) => p.type === 'accessory' || p.category_name?.includes('ملحق'))
    .slice(0, 4);

  const whatsappPhone = shopInfo?.whatsapp || '249912345678';
  const whatsappUrl = `https://wa.me/${whatsappPhone}`;

  return (
    <Page className={styles.container}>
      {/* 1. Header Greeting & Search */}
      <header className={styles.header}>
        <h1 className={styles.greeting}>
          {user?.name ? `مرحبًا، ${user.name}` : 'مرحبًا بك'}
        </h1>

        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchWrapper}>
            <Search size={20} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
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

        {/* Caption: Last Price Update (once) with pulsing freshness dot */}
        <div className={styles.priceUpdateWrapper}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <p className={styles.priceUpdateCaption}>
            آخر تحديث للأسعار: {formatPriceUpdateCaption(shopInfo?.prices_updated_at)}
          </p>
        </div>
      </header>

      {/* 2. Hero Section (Official Brand Gradient with Slanted Ribbon & Device Silhouette) */}
      <section className={styles.heroCard} aria-label="العروض الرئيسية">
        <div className={styles.heroRibbonShine} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>{slides[activeSlide].title}</h2>
            <p className={styles.heroText}>{slides[activeSlide].text}</p>
            <button
              type="button"
              onClick={slides[activeSlide].action}
              className={styles.heroBtn}
            >
              <span>{slides[activeSlide].buttonLabel}</span>
              <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <ProductTypeSvg
              type={activeSlide === 1 ? 'laptop' : (activeSlide === 2 ? 'accessory' : 'laptop')}
              className={styles.heroIllustration}
            />
          </div>
        </div>

        {/* Slide Indicators */}
        <div className={styles.heroDots} role="tablist" aria-label="شرائح العرض">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeSlide === idx}
              aria-label={`الشريحة ${idx + 1}`}
              className={`${styles.heroDot} ${activeSlide === idx ? styles.heroDotActive : ''}`}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* 3. Category Bubbles (ONE Row: الحواسيب، الهواتف، الملحقات) */}
      <section className={styles.categoriesRow} aria-label="أقسام المتجر">
        <Link to="/products?type=laptop" className={styles.categoryTile}>
          <div className={styles.categoryIconBubble}>
            <Laptop size={24} strokeWidth={1.75} />
          </div>
          <span className={styles.categoryTitle}>الحواسيب</span>
        </Link>

        <Link to="/products?type=phone" className={styles.categoryTile}>
          <div className={styles.categoryIconBubble}>
            <Smartphone size={24} strokeWidth={1.75} />
          </div>
          <span className={styles.categoryTitle}>الهواتف</span>
        </Link>

        <Link to="/products?type=accessory" className={styles.categoryTile}>
          <div className={styles.categoryIconBubble}>
            <Headphones size={24} strokeWidth={1.75} />
          </div>
          <span className={styles.categoryTitle}>الملحقات</span>
        </Link>
      </section>

      {/* 4. App Discount Ribbon Banner */}
      <div
        className={`${styles.appDiscountBanner} ${styles.wexRibbon}`}
        onClick={() => navigate('/products')}
        role="button"
        tabIndex={0}
        aria-label="خصم 3% للطلب عبر التطبيق"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate('/products');
        }}
      >
        <div className={styles.discountTextCol}>
          <span className={styles.discountTag}>خصم الطلب بالتطبيق</span>
          <h3 className={styles.discountTitle}>خصم 3% للطلب عبر التطبيق</h3>
          <p className={styles.discountSubtitle}>تصفّح العروض المتوفرة وأكّد طلبك بسهولة</p>
        </div>
        <div className={styles.discountBadgeCircle}>
          <span className={styles.discountBadgeNum}>-3%</span>
          <span className={styles.discountBadgeLabel}>تخفيض</span>
        </div>
      </div>

      {/* 5. Brand Logos Strip */}
      <section className={styles.brandStripSection} aria-label="العلامات التجارية">
        <div className={styles.brandScroll}>
          {['Dell', 'Lenovo', 'HP', 'Apple', 'Acer', 'Asus'].map((brand) => (
            <Link
              key={brand}
              to={`/products?brand=${encodeURIComponent(brand)}`}
              className={styles.brandChip}
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Section: وصل حديثًا */}
      {newArrivals.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>وصل حديثًا</h2>
            <Link to="/products" className={styles.viewAllLink}>
              عرض الكل
            </Link>
          </div>
          <div className={styles.grid}>
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Section: للدراسة */}
      {studyProducts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>للدراسة</h2>
            <Link to="/products?type=laptop" className={styles.viewAllLink}>
              عرض الكل
            </Link>
          </div>
          <div className={styles.grid}>
            {studyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 8. Section: للعمل */}
      {workProducts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>للعمل</h2>
            <Link to="/products?type=laptop" className={styles.viewAllLink}>
              عرض الكل
            </Link>
          </div>
          <div className={styles.grid}>
            {workProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 9. Section: ملحقات */}
      {accessoryProducts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>ملحقات</h2>
            <Link to="/products?type=accessory" className={styles.viewAllLink}>
              عرض الكل
            </Link>
          </div>
          <div className={styles.grid}>
            {accessoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 10. Steps: طريقة الطلب (Once) */}
      <section id="how-to-order" className={styles.stepsSection}>
        <h2 className={styles.sectionTitle}>طريقة الطلب</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <span className={styles.stepBadge}>1</span>
            <div className={styles.stepText}>
              <h3 className={styles.stepTitle}>اختر الجهاز</h3>
            </div>
          </div>

          <div className={styles.stepCard}>
            <span className={styles.stepBadge}>2</span>
            <div className={styles.stepText}>
              <h3 className={styles.stepTitle}>أكّد الطلب وثبّت السعر</h3>
            </div>
          </div>

          <div className={styles.stepCard}>
            <span className={styles.stepBadge}>3</span>
            <div className={styles.stepText}>
              <h3 className={styles.stepTitle}>حوّل المبلغ وارفع الإشعار</h3>
            </div>
          </div>

          <div className={styles.stepCard}>
            <span className={styles.stepBadge}>4</span>
            <div className={styles.stepText}>
              <h3 className={styles.stepTitle}>استلم من المحل أو بالتوصيل</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Shop Block (Once) */}
      <section className={styles.shopBlock}>
        <h2 className={styles.shopTitle}>ويكس تكنولوجي</h2>
        <p className={styles.teamTagline}>فريق ويكس في خدمتكم في المتجر بأم درمان</p>
        <p className={styles.shopAddress}>
          {shopInfo?.address || 'مول الواحة، الشهداء، أم درمان'}
        </p>
        <div className={styles.shopHours}>
          <p>السبت - الخميس: 9:00 ص - 9:00 م</p>
          <p>الجمعة: مغلق</p>
        </div>
        <div className={styles.shopActions}>
          <a
            href="https://maps.google.com/?q=Al-Waha+Mall+Omdurman"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapBtn}
          >
            <MapPin size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>الموقع على الخريطة</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappBtn}
          >
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>تواصل عبر واتساب</span>
          </a>
        </div>
      </section>
    </Page>
  );
}
