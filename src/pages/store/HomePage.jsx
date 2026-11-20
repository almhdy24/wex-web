import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  MessageCircle,
  MapPin,
  Clock,
  Laptop,
  Smartphone,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Banknote,
  Truck,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { productsApi } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/products/ProductCard';
import PriceNotice, { formatPricesUpdatedAt } from '../../components/common/PriceNotice';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { Reveal, Stagger, useParallax } from '../../motion';
import { t } from '../../content/ar';
import LaptopSvg from '../../components/common/LaptopSvg';
import styles from './HomePage.module.css';

const PLACEHOLDERS = [
  'ابحث عن جهاز، مثل: Dell Latitude',
  'ابحث عن جهاز، مثل: Lenovo ThinkPad',
  'ابحث عن جهاز، مثل: HP EliteBook',
  'ابحث عن ملحقات، مثل: شاحن حاسوب',
];

const POPULAR_SEARCHES = ['Dell', 'ThinkPad', 'HP', 'Core i5', 'شاحن'];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shopInfo, setShopInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Hero carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Floating WhatsApp scroll behavior
  const [showWhatsappFab, setShowWhatsappFab] = useState(true);
  const lastScrollY = useRef(0);

  // Parallax for hero drifting ribbons
  const heroParallax = useParallax(0.12);

  // Rotate search placeholder every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance hero carousel every 5s unless paused
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Floating WhatsApp scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        setShowWhatsappFab(false);
      } else {
        setShowWhatsappFab(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopRes, prodsRes] = await Promise.all([
        productsApi.getShopInfo(),
        productsApi.getProducts({ per_page: 24 }),
      ]);

      setShopInfo(shopRes?.data || null);
      setProducts(prodsRes?.data || []);
    } catch (err) {
      setError(err.message || 'تعذر تحميل بيانات المتجر');
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

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left (in RTL: goes to previous or next depending on preference, let's advance)
        setActiveSlide((prev) => (prev + 1) % 3);
      } else {
        setActiveSlide((prev) => (prev - 1 + 3) % 3);
      }
    }
    setTimeout(() => setIsPaused(false), 2000);
  };

  const priceLockHours = shopInfo?.lock_hours || shopInfo?.price_lock_hours || 4;

  // Segment products for the 4 Rails
  const newArrivals = products.slice(0, 6);
  const studyLaptops = products
    .filter((p) => {
      const desc = (p.short_description || p.name || '').toLowerCase();
      return desc.includes('i3') || desc.includes('i5') || (p.price_sdg && p.price_sdg < 900000);
    })
    .slice(0, 6);
  const workLaptops = products
    .filter((p) => {
      const desc = (p.short_description || p.name || '').toLowerCase();
      return desc.includes('thinkpad') || desc.includes('latitude') || desc.includes('elitebook') || desc.includes('i7');
    })
    .slice(0, 6);
  const accessories = products
    .filter((p) => {
      const cat = (p.category?.name || p.category_slug || '').toLowerCase();
      const desc = (p.short_description || p.name || '').toLowerCase();
      return cat.includes('access') || cat.includes('ملحق') || desc.includes('charger') || desc.includes('شاحن') || desc.includes('ماوس');
    })
    .slice(0, 6);

  const greetingText = user?.name
    ? t('home.greetingUser', { name: user.name })
    : t('home.greetingGuest');

  return (
    <div className={styles.container}>
      {/* 2. Greeting Line & Rotating Search */}
      <section className={styles.greetingSection} aria-label="الترحيب والبحث">
        <div className={styles.greetingHeader}>
          <div>
            <h1 className={styles.greetingTitle}>{greetingText}</h1>
            <p className={styles.greetingSub}>{t('splash.subtitle')}</p>
          </div>
          {shopInfo?.prices_updated_at && (
            <div className={styles.priceFreshnessBadge} title={t('priceNotice.pricesUpdatedAt', { time: formatPricesUpdatedAt(shopInfo.prices_updated_at) })}>
              <span className={styles.pulseDot} />
              <span className={styles.freshnessText}>
                {t('priceNotice.pricesUpdatedAt', { time: formatPricesUpdatedAt(shopInfo.prices_updated_at) })}
              </span>
            </div>
          )}
        </div>

        {/* Prominent Search Bar */}
        <div className={styles.searchWrapper}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className={styles.searchInput}
              aria-label={t('home.searchPlaceholder')}
            />
            <button type="submit" className={styles.searchBtn} aria-label="بحث">
              <Search size={18} />
            </button>
          </form>

          {/* Quick Search Chips on Focus */}
          {isSearchFocused && (
            <div className={styles.searchChipsPopup}>
              <span className={styles.chipsLabel}>{t('home.popularSearches')}:</span>
              <div className={styles.chipsRow}>
                {POPULAR_SEARCHES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onMouseDown={() => {
                      setSearchQuery(chip);
                      navigate(`/products?search=${encodeURIComponent(chip)}`);
                    }}
                    className={styles.popularChip}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Hero Carousel (Dark navy with animated drifting ribbons & parallax) */}
      <section
        className={styles.heroSection}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="عروض المتجر"
      >
        <div className={styles.heroParallaxBg} ref={heroParallax}>
          <div className={styles.heroRibbon1} />
          <div className={styles.heroRibbon2} />
        </div>

        <div className={styles.slidesContainer}>
          {/* Slide 1: New Arrivals */}
          <div className={`${styles.slide} ${activeSlide === 0 ? styles.slideActive : ''}`}>
            <div className={styles.slideContent}>
              <span className={styles.slideBadge}>{t('home.rails.newArrivals')}</span>
              <h2 className={styles.slideTitle}>{t('home.hero.slide1Title')}</h2>
              <p className={styles.slideDesc}>{t('home.hero.slide1Subtitle')}</p>
              <Link to="/products?sort=newest" className={styles.slideCta}>
                <span>{t('home.hero.slide1Cta')}</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
            <div className={styles.slideVisual}>
              <LaptopSvg silhouette="modern" accentColor="#00B7FF" />
            </div>
          </div>

          {/* Slide 2: Price Lock Guarantee */}
          <div className={`${styles.slide} ${activeSlide === 1 ? styles.slideActive : ''}`}>
            <div className={styles.slideContent}>
              <span className={styles.slideBadge}>{t('home.hero.slide2Title')}</span>
              <h2 className={styles.slideTitle}>{t('home.hero.slide2Title')}</h2>
              <p className={styles.slideDesc}>
                {t('home.hero.slide2Subtitle', { hours: priceLockHours })}
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('how-to-order-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={styles.slideCta}
              >
                <span>{t('home.hero.slide2Cta')}</span>
                <ArrowLeft size={16} />
              </button>
            </div>
            <div className={styles.slideVisualLock}>
              <div className={styles.lockIllustration}>
                <Lock size={44} className={styles.lockIcon} />
                <Clock size={28} className={styles.clockIcon} />
              </div>
            </div>
          </div>

          {/* Slide 3: Accessories */}
          <div className={`${styles.slide} ${activeSlide === 2 ? styles.slideActive : ''}`}>
            <div className={styles.slideContent}>
              <span className={styles.slideBadge}>{t('home.categories.accessories')}</span>
              <h2 className={styles.slideTitle}>{t('home.hero.slide3Title')}</h2>
              <p className={styles.slideDesc}>{t('home.hero.slide3Subtitle')}</p>
              <Link to="/products?category=accessories" className={styles.slideCta}>
                <span>{t('home.hero.slide3Cta')}</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
            <div className={styles.slideVisual}>
              <Headphones size={68} strokeWidth={1.5} className={styles.accessoriesIcon} />
            </div>
          </div>
        </div>

        {/* Carousel Progress Dots */}
        <div className={styles.carouselDots} role="tablist" aria-label="مؤشرات الشرائح">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeSlide === idx}
              onClick={() => setActiveSlide(idx)}
              className={`${styles.dot} ${activeSlide === idx ? styles.dotActive : ''}`}
              aria-label={`شريحة ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 4. Quick Actions Row (4 round icon tiles) */}
      <section className={styles.quickActionsSection} aria-label="روابط سريعة">
        <div className={styles.quickActionsGrid}>
          <Link to="/products" className={styles.actionTile}>
            <div className={styles.actionIconBubble}>
              <Laptop size={22} />
            </div>
            <span className={styles.actionLabel}>{t('home.quickActions.browse')}</span>
          </Link>

          <Link to="/orders" className={styles.actionTile}>
            <div className={styles.actionIconBubble}>
              <PackageCheck size={22} />
            </div>
            <span className={styles.actionLabel}>{t('home.quickActions.track')}</span>
          </Link>

          <a
            href="https://wa.me/249912345678"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionTile}
          >
            <div className={`${styles.actionIconBubble} ${styles.actionWhatsapp}`}>
              <MessageCircle size={22} />
            </div>
            <span className={styles.actionLabel}>{t('home.quickActions.whatsapp')}</span>
          </a>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('shop-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={styles.actionTile}
          >
            <div className={styles.actionIconBubble}>
              <MapPin size={22} />
            </div>
            <span className={styles.actionLabel}>{t('home.quickActions.location')}</span>
          </button>
        </div>
      </section>

      {/* 5. Category Tiles & Condition Chips */}
      <section className={styles.categoriesSection} aria-label="التصنيفات وحالة الأجهزة">
        <div className={styles.categoriesRow}>
          <Link to="/products?category=laptops" className={styles.catCard}>
            <Laptop size={20} className={styles.catIcon} />
            <span className={styles.catName}>{t('home.categories.laptops')}</span>
          </Link>

          <Link to="/products?category=phones" className={styles.catCard}>
            <Smartphone size={20} className={styles.catIcon} />
            <span className={styles.catName}>{t('home.categories.phones')}</span>
          </Link>

          <Link to="/products?category=accessories" className={styles.catCard}>
            <Headphones size={20} className={styles.catIcon} />
            <span className={styles.catName}>{t('home.categories.accessories')}</span>
          </Link>
        </div>

        <div className={styles.conditionChipsRow}>
          <Link to="/products?condition=new" className={styles.conditionChip}>
            <span className={styles.conditionDotNew} />
            <span>{t('home.categories.conditionNew')}</span>
          </Link>
          <Link to="/products?condition=used" className={styles.conditionChip}>
            <span className={styles.conditionDotUsed} />
            <span>{t('home.categories.conditionUsed')}</span>
          </Link>
        </div>
      </section>

      {error && <ErrorState message={error} onRetry={loadHomeData} />}

      {/* 6. Rails from API with Scroll-Snap */}
      {/* Rail 1: New Arrivals */}
      {(loading || newArrivals.length > 0) && (
        <section className={styles.railSection} aria-label={t('home.rails.newArrivals')}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('home.rails.newArrivals')}</h2>
            </div>
            <Link to="/products?sort=newest" className={styles.viewAllLink}>
              <span>{t('home.rails.viewAll')}</span>
              <ChevronRight size={16} className={styles.viewAllArrow} />
            </Link>
          </div>

          <div className={styles.railTrack}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.railCardWrapper}>
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              newArrivals.map((prod, idx) => (
                <div key={prod.id} className={styles.railCardWrapper}>
                  <ProductCard product={prod} index={idx} />
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Rail 2: Suitable for Study */}
      {(loading || studyLaptops.length > 0) && (
        <section className={styles.railSection} aria-label={t('home.rails.study')}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('home.rails.study')}</h2>
            </div>
            <Link to="/products?category=budget" className={styles.viewAllLink}>
              <span>{t('home.rails.viewAll')}</span>
              <ChevronRight size={16} className={styles.viewAllArrow} />
            </Link>
          </div>

          <div className={styles.railTrack}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.railCardWrapper}>
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              studyLaptops.map((prod, idx) => (
                <div key={prod.id} className={styles.railCardWrapper}>
                  <ProductCard product={prod} index={idx} />
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Rail 3: Suitable for Work */}
      {(loading || workLaptops.length > 0) && (
        <section className={styles.railSection} aria-label={t('home.rails.work')}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('home.rails.work')}</h2>
            </div>
            <Link to="/products?category=business" className={styles.viewAllLink}>
              <span>{t('home.rails.viewAll')}</span>
              <ChevronRight size={16} className={styles.viewAllArrow} />
            </Link>
          </div>

          <div className={styles.railTrack}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.railCardWrapper}>
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              workLaptops.map((prod, idx) => (
                <div key={prod.id} className={styles.railCardWrapper}>
                  <ProductCard product={prod} index={idx} />
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Rail 4: Accessories (if available) */}
      {accessories.length > 0 && (
        <section className={styles.railSection} aria-label={t('home.rails.accessories')}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('home.rails.accessories')}</h2>
            </div>
            <Link to="/products?category=accessories" className={styles.viewAllLink}>
              <span>{t('home.rails.viewAll')}</span>
              <ChevronRight size={16} className={styles.viewAllArrow} />
            </Link>
          </div>

          <div className={styles.railTrack}>
            {accessories.map((prod, idx) => (
              <div key={prod.id} className={styles.railCardWrapper}>
                <ProductCard product={prod} index={idx} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. "How to Order" (4 animated steps with connecting ribbon line) */}
      <Reveal direction="up" delay={50}>
        <section id="how-to-order-section" className={styles.howToOrderSection} aria-label="كيف تطلب من المتجر">
          <div className={styles.howToOrderHeader}>
            <h2 className={styles.howToOrderTitle}>{t('home.howToOrder.title')}</h2>
            <p className={styles.howToOrderSub}>{t('home.howToOrder.subtitle')}</p>
          </div>

          <div className={styles.stepsContainer}>
            <div className={styles.stepConnectorLine} aria-hidden="true" />

            <Stagger staggerDelay={80} className={styles.stepsList}>
              <div className={styles.stepCard}>
                <div className={styles.stepIconBubble}>
                  <Laptop size={20} />
                  <span className={styles.stepBadge}>1</span>
                </div>
                <h3 className={styles.stepHeading}>{t('home.howToOrder.step1Title')}</h3>
                <p className={styles.stepDescription}>{t('home.howToOrder.step1Desc')}</p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepIconBubble}>
                  <ShieldCheck size={20} />
                  <span className={styles.stepBadge}>2</span>
                </div>
                <h3 className={styles.stepHeading}>{t('home.howToOrder.step2Title')}</h3>
                <p className={styles.stepDescription}>{t('home.howToOrder.step2Desc')}</p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepIconBubble}>
                  <Banknote size={20} />
                  <span className={styles.stepBadge}>3</span>
                </div>
                <h3 className={styles.stepHeading}>{t('home.howToOrder.step3Title')}</h3>
                <p className={styles.stepDescription}>{t('home.howToOrder.step3Desc')}</p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepIconBubble}>
                  <Truck size={20} />
                  <span className={styles.stepBadge}>4</span>
                </div>
                <h3 className={styles.stepHeading}>{t('home.howToOrder.step4Title')}</h3>
                <p className={styles.stepDescription}>{t('home.howToOrder.step4Desc')}</p>
              </div>
            </Stagger>
          </div>
        </section>
      </Reveal>

      {/* 8. Price Notice Card (Generic SDG-only Notice) */}
      <Reveal direction="up" delay={50}>
        <section className={styles.priceNoticeSection} aria-label="تنبيه أسعار الصرف">
          <PriceNotice
            variant="full"
            lockHours={priceLockHours}
            pricesUpdatedAt={shopInfo?.prices_updated_at}
            showLastUpdated={true}
          />
        </section>
      </Reveal>

      {/* 9. Shop Location & Hours Card */}
      <Reveal direction="up" delay={50}>
        <section id="shop-card" className={styles.shopSection} aria-label="معلومات وموقع المتجر">
          <div className={styles.shopCard}>
            <div className={styles.shopCardRibbon} />
            <div className={styles.shopHeader}>
              <h3 className={styles.shopTitle}>{t('home.shopInfo.title')}</h3>
              <p className={styles.shopLocationHighlight}>مول الواحة — الشهداء — أم درمان</p>
            </div>

            <div className={styles.shopDetails}>
              <div className={styles.shopDetailRow}>
                <MapPin size={18} className={styles.shopIcon} />
                <span>{t('home.shopInfo.address')}</span>
              </div>
              <div className={styles.shopDetailRow}>
                <Clock size={18} className={styles.shopIcon} />
                <div>
                  <p>{t('home.shopInfo.hours')}</p>
                  <span className={styles.shopNote}>{t('home.shopInfo.openHoursNote')}</span>
                </div>
              </div>
            </div>

            <div className={styles.shopActions}>
              <a
                href="https://maps.google.com/?q=Al-Waha+Mall+Omdurman"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shopMapBtn}
              >
                <ExternalLink size={16} />
                <span>{t('home.shopInfo.openMap')}</span>
              </a>
              <a
                href="https://wa.me/249912345678"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shopWhatsappBtn}
              >
                <MessageCircle size={16} />
                <span>{t('home.shopInfo.whatsappChat')}</span>
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      {/* 10. Floating WhatsApp Button (Bottom-start, auto-hides on scroll down) */}
      <a
        href="https://wa.me/249912345678"
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.floatingWhatsapp} ${showWhatsappFab ? styles.floatingWhatsappVisible : styles.floatingWhatsappHidden}`}
        title={t('home.floatingWhatsapp')}
        aria-label={t('home.floatingWhatsapp')}
      >
        <MessageCircle size={24} />
      </a>
    </div>
  );
}
