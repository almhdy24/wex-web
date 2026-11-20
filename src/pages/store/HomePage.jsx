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
  ChevronLeft,
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
  const [heroSlides, setHeroSlides] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const effectiveSlides = heroSlides.length > 0 ? heroSlides : [
    {
      title: t('home.hero.slide1Title'),
      subtitle: t('home.hero.slide1Subtitle'),
      badge: t('home.rails.newArrivals'),
      button_label: t('home.hero.slide1Cta'),
      link: '/products?sort=newest',
      type: 'laptops',
    },
    {
      title: t('home.hero.slide2Title'),
      subtitle: t('home.hero.slide2Subtitle', { hours: 4 }),
      badge: t('home.hero.slide2Title'),
      button_label: t('home.hero.slide2Cta'),
      link: '#how-to-order-section',
      type: 'lock',
    },
    {
      title: t('home.hero.slide3Title'),
      subtitle: t('home.hero.slide3Subtitle'),
      badge: t('home.categories.accessories'),
      button_label: t('home.hero.slide3Cta'),
      link: '/products?category=accessories',
      type: 'accessories',
    },
  ];

  const slidesCount = effectiveSlides.length;

  const railRef1 = useRef(null);
  const railRef2 = useRef(null);
  const railRef3 = useRef(null);
  const railRef4 = useRef(null);

  const scrollRail = (ref, direction) => {
    if (!ref.current) return;
    const delta = direction === 'next' ? -340 : 340;
    ref.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handlePrevSlide = () => setActiveSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % slidesCount);

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
    if (isPaused || slidesCount <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slidesCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slidesCount]);

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
      const [shopRes, prodsRes, slidesRes] = await Promise.all([
        productsApi.getShopInfo().catch(() => ({ data: null })),
        productsApi.getProducts({ per_page: 24 }).catch(() => ({ data: [] })),
        productsApi.getHeroSlides().catch(() => ({ data: [] })),
      ]);

      setShopInfo(shopRes?.data || null);
      setProducts(prodsRes?.data || []);
      if (slidesRes?.data?.length > 0) {
        setHeroSlides(slidesRes.data);
      }
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
          {effectiveSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`${styles.slide} ${activeSlide === idx ? styles.slideActive : ''}`}
            >
              <div className={styles.slideContent}>
                <span className={styles.slideBadge}>{slide.badge || 'أجهزة مختارة'}</span>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
                <p className={styles.slideDesc}>{slide.subtitle}</p>
                {slide.link && slide.link.startsWith('#') ? (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(slide.link.slice(1));
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={styles.slideCta}
                  >
                    <span>{slide.button_label || 'عرض التفاصيل'}</span>
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <Link to={slide.link || '/catalog'} className={styles.slideCta}>
                    <span>{slide.button_label || 'استعرض الأجهزة'}</span>
                    <ArrowLeft size={16} />
                  </Link>
                )}
              </div>
              <div className={styles.slideVisual}>
                {slide.image && !slide.image.startsWith('/assets/hero') ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={styles.slideCustomImg}
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                ) : idx === 1 || slide.type === 'lock' ? (
                  <div className={styles.lockIllustration}>
                    <Lock size={44} className={styles.lockIcon} />
                    <Clock size={28} className={styles.clockIcon} />
                  </div>
                ) : idx === 2 || slide.type === 'accessories' ? (
                  <Headphones size={68} strokeWidth={1.5} className={styles.accessoriesIcon} />
                ) : (
                  <LaptopSvg silhouette="modern" accentColor="#00B7FF" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Progress Dots */}
        <div className={styles.carouselDots} role="tablist" aria-label="مؤشرات الشرائح">
          {effectiveSlides.map((_, idx) => (
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

        {/* Desktop Carousel Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrevSlide}
          className={`${styles.carouselArrow} ${styles.carouselArrowPrev}`}
          aria-label="الشريحة السابقة"
          title="الشريحة السابقة"
        >
          <ChevronRight size={22} />
        </button>
        <button
          type="button"
          onClick={handleNextSlide}
          className={`${styles.carouselArrow} ${styles.carouselArrowNext}`}
          aria-label="الشريحة التالية"
          title="الشريحة التالية"
        >
          <ChevronLeft size={22} />
        </button>
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
            <div className={styles.railHeaderActions}>
              <div className={styles.railNavArrows}>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef1, 'prev')}
                  aria-label="السابق"
                  title="السابق"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef1, 'next')}
                  aria-label="التالي"
                  title="التالي"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <Link to="/products?sort=newest" className={styles.viewAllLink}>
                <span>{t('home.rails.viewAll')}</span>
                <ChevronRight size={16} className={styles.viewAllArrow} />
              </Link>
            </div>
          </div>

          <div ref={railRef1} className={styles.railTrack}>
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
            <div className={styles.railHeaderActions}>
              <div className={styles.railNavArrows}>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef2, 'prev')}
                  aria-label="السابق"
                  title="السابق"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef2, 'next')}
                  aria-label="التالي"
                  title="التالي"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <Link to="/products?category=budget" className={styles.viewAllLink}>
                <span>{t('home.rails.viewAll')}</span>
                <ChevronRight size={16} className={styles.viewAllArrow} />
              </Link>
            </div>
          </div>

          <div ref={railRef2} className={styles.railTrack}>
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
            <div className={styles.railHeaderActions}>
              <div className={styles.railNavArrows}>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef3, 'prev')}
                  aria-label="السابق"
                  title="السابق"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef3, 'next')}
                  aria-label="التالي"
                  title="التالي"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <Link to="/products?category=business" className={styles.viewAllLink}>
                <span>{t('home.rails.viewAll')}</span>
                <ChevronRight size={16} className={styles.viewAllArrow} />
              </Link>
            </div>
          </div>

          <div ref={railRef3} className={styles.railTrack}>
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
            <div className={styles.railHeaderActions}>
              <div className={styles.railNavArrows}>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef4, 'prev')}
                  aria-label="السابق"
                  title="السابق"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  className={styles.railArrowBtn}
                  onClick={() => scrollRail(railRef4, 'next')}
                  aria-label="التالي"
                  title="التالي"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <Link to="/products?category=accessories" className={styles.viewAllLink}>
                <span>{t('home.rails.viewAll')}</span>
                <ChevronRight size={16} className={styles.viewAllArrow} />
              </Link>
            </div>
          </div>

          <div ref={railRef4} className={styles.railTrack}>
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

            <div className={styles.shopContentGrid}>
              <div className={styles.shopInfoColumn}>
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

              {/* Map Preview Card for Desktop */}
              <div className={styles.shopMapColumn}>
                <a
                  href="https://maps.google.com/?q=Al-Waha+Mall+Omdurman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapCardLink}
                  aria-label="عرض موقع المحل في خرائط Google"
                >
                  <div className={styles.mapPinGraphic}>
                    <MapPin size={36} className={styles.mapPinIcon} />
                    <span className={styles.mapPinLabel}>مول الواحة — الطابق الأرضي</span>
                    <span className={styles.mapPinSub}>الشهداء، أم درمان</span>
                  </div>
                  <span className={styles.mapOpenHint}>افتح في الخرائط</span>
                </a>
              </div>
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
