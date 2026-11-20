import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, MessageCircle, MapPin, Clock } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './HomePage.module.css';

// Exact SVG Category Icons from Mockup
function CategoryIcon({ type }) {
  if (type === 'briefcase') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    );
  }
  if (type === 'gamepad') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
        <rect x="2" y="6" width="20" height="12" rx="4" />
      </svg>
    );
  }
  if (type === 'graduation') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }
  if (type === 'ultrabook') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="12" rx="2" />
        <line x1="1" y1="20" x2="23" y2="20" />
      </svg>
    );
  }
  // Default Box (All / General)
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

// Built-in mockup categories with matching SVGs
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'الكل', type: 'box', slug: '' },
  { id: 'business', name: 'أعمال', type: 'briefcase', slug: 'business' },
  { id: 'gaming', name: 'ألعاب', type: 'gamepad', slug: 'gaming' },
  { id: 'budget', name: 'اقتصادية', type: 'graduation', slug: 'budget' },
  { id: 'ultrabooks', name: 'أجهزة خفيفة', type: 'ultrabook', slug: 'ultrabook' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [shopInfo, setShopInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopRes, catsRes, featuredRes] = await Promise.all([
        productsApi.getShopInfo(),
        productsApi.getCategories(),
        productsApi.getProducts({ per_page: 8 }),
      ]);

      setShopInfo(shopRes?.data || null);
      const apiCats = catsRes?.data || [];
      setCategories(apiCats.length > 0 ? apiCats : DEFAULT_CATEGORIES);
      setFeaturedProducts(featuredRes?.data || []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل بيانات الصفحة الرئيسية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const exchangeRate = shopInfo?.exchange_rate_sdg || 650;
  const priceLockHours = shopInfo?.price_lock_hours || 4;

  return (
    <div className={styles.container}>
      {/* 1. User Greeting & Live Rate Chip */}
      <section className={styles.greetingSection} aria-label="الترحيب وسعر الصرف">
        <div>
          <div className={styles.greetingSub}>أهلاً بيك</div>
          <h1 className={styles.greetingTitle}>لابتوبات جديدة ومستعملة</h1>
        </div>

        <div className={styles.rateChip} title="سعر الصرف المعتمد اليوم">
          <span className={styles.pulseDot} />
          <span className={styles.rateText}>الدرهم اليوم: {exchangeRate} جنيه</span>
        </div>
      </section>

      {/* 2. Search Input */}
      <section className={styles.searchSection} aria-label="البحث عن لابتوب">
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن لابتوب أو مواصفات..."
            className={styles.searchInput}
            aria-label="ابحث في المتجر"
          />
          <Search size={18} className={styles.searchIcon} />
        </form>
      </section>

      {/* 3. App Discount Banner with Slanted Ribbons */}
      <section
        className={`${styles.discountBanner} wex-ribbon`}
        onClick={() => navigate('/products')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate('/products'); }}
        aria-label="خصم الطلب بالتطبيق"
      >
        <div className={styles.discountContent}>
          <span className={styles.discountChip}>خصم الطلب بالتطبيق</span>
          <h3 className={styles.discountHeading}>خصم 3% لو طلبت من التطبيق</h3>
          <p className={styles.discountSub}>
            السعر بيتثبت ليك لمدة {priceLockHours} ساعات عشان تحول
          </p>
        </div>

        <div className={styles.discountBadgeCircle}>
          <span className={styles.badgeNum}>-3%</span>
          <span className={styles.badgeLabel}>تخفيض</span>
        </div>
      </section>

      {/* 4. Categories Scroll Row */}
      <section className={styles.categoriesSection} aria-label="التصنيفات">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>التصنيفات</h2>
          <Link to="/products" className={styles.viewAllLink}>
            عرض الكل
          </Link>
        </div>

        <div className={styles.categoriesScroll}>
          {categories.map((cat, idx) => {
            const catType = cat.type || (idx === 0 ? 'box' : idx === 1 ? 'briefcase' : idx === 2 ? 'gamepad' : idx === 3 ? 'graduation' : 'ultrabook');
            const targetUrl = cat.slug ? `/products?category=${encodeURIComponent(cat.slug)}` : '/products';

            return (
              <Link key={cat.id || idx} to={targetUrl} className={styles.categoryChipItem}>
                <div className={styles.categoryIconBubble}>
                  <CategoryIcon type={catType} />
                </div>
                <span className={styles.categoryTitle}>{cat.name_ar || cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {error && <ErrorState message={error} onRetry={loadHomeData} />}

      {/* 5. Featured Products (2-Column Grid) */}
      <section className={styles.featuredSection} aria-label="أجهزة مختارة">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>أجهزة مختارة</h2>
          <Link to="/products" className={styles.viewAllLink}>
            <span>كل الأجهزة</span>
            <ArrowLeft size={14} />
          </Link>
        </div>

        <div className={styles.productGrid}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))
          ) : !error ? (
            <p className={styles.emptyNotice}>لا توجد أجهزة متوفرة حالياً</p>
          ) : null}
        </div>
      </section>

      {/* 6. Store Feature Notice (Subtle Ribbon) */}
      <section className={`${styles.priceLockNotice} wex-ribbon-subtle`} aria-label="طريقة تثبيت السعر">
        <div>
          <h4 className={styles.noticeTitle}>طريقة تثبيت السعر</h4>
          <p className={styles.noticeText}>
            سعر اللابتوب بالدرهم وبيتغير مع الصرف. لما تطلب، بنثبت ليك السعر لمدة {priceLockHours} ساعات وبتحول فيها عبر بنكك. لو المدة انتهت بيرجع السعر للصرف الحالي.
          </p>
        </div>
      </section>

      {/* 7. Shop Info Card */}
      <section className={styles.shopSection} aria-label="معلومات المتجر">
        <div className={styles.shopCard}>
          <div className={styles.shopMain}>
            <h3 className={styles.shopTitle}>متجر ويكس تكنولوجي — أم درمان</h3>
            <p className={styles.shopDesc}>
              محل لابتوبات وإلكترونيات في مول الواحة بأم درمان. أجهزة جديدة ومستعملة فحص دقيق ومعاينة مباشرة قبل الدفع.
            </p>
            <div className={styles.shopMetaRow}>
              <div className={styles.metaItem}>
                <MapPin size={16} className={styles.metaIcon} />
                <span>مول الواحة — الشهداء — أم درمان</span>
              </div>
              <div className={styles.metaItem}>
                <Clock size={16} className={styles.metaIcon} />
                <span>السبت - الخميس: 10:00 ص - 10:00 م</span>
              </div>
            </div>

            <a
              href="https://wa.me/249912345678"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              <MessageCircle size={18} />
              <span>تواصل عبر واتساب للاستفسار</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
