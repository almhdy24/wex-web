import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, MapPin, Clock, Coins, MessageCircle } from 'lucide-react';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import styles from './HomePage.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [shopInfo, setShopInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopRes, catsRes, latestRes, accRes] = await Promise.all([
        productsApi.getShopInfo(),
        productsApi.getCategories(),
        productsApi.getProducts({ sort: 'newest', per_page: 8 }),
        productsApi.getProducts({ type: 'accessory', per_page: 4 }),
      ]);

      setShopInfo(shopRes?.data || null);
      setCategories(catsRes?.data || []);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Search Field */}
      <section className={styles.searchSection} aria-label="البحث عن منتج">
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن لابتوب، هاتف، أو ملحق..."
            className={styles.searchInput}
            aria-label="ابحث في المتجر"
          />
        </form>
      </section>

      {/* 2. Category Chips */}
      {categories.length > 0 && (
        <section className={styles.categorySection} aria-label="التصنيفات">
          <div className={styles.categoryScroll}>
            <Link to="/products" className={styles.categoryChip}>
              كل الأجهزة
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className={styles.categoryChip}
              >
                {cat.name_ar}
              </Link>
            ))}
          </div>
        </section>
      )}

      {error && <ErrorState message={error} onRetry={loadHomeData} />}

      {/* 3. "وصل جديد" Product Grid */}
      <section className={styles.section} aria-label="وصل جديد">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>وصل جديد</h2>
          <Link to="/products?sort=newest" className={styles.viewAllLink}>
            <span>عرض الكل</span>
            <ArrowLeft size={16} />
          </Link>
        </div>

        <div className={styles.productGrid}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : latestProducts.length > 0
            ? latestProducts.map((prod) => <ProductCard key={prod.id} product={prod} />)
            : !error && <p>لا توجد أجهزة متوفرة حالياً</p>}
        </div>
      </section>

      {/* 4. "ملحقات" Section */}
      {(accessories.length > 0 || loading) && (
        <section className={styles.section} aria-label="الملحقات">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>ملحقات</h2>
            <Link to="/products?type=accessory" className={styles.viewAllLink}>
              <span>عرض كل الملحقات</span>
              <ArrowLeft size={16} />
            </Link>
          </div>

          <div className={styles.productGrid}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : accessories.map((prod) => <ProductCard key={prod.id} product={prod} />)}
          </div>
        </section>
      )}

      {/* 5. Compact 3-Step "كيف تطلب" */}
      <section className={styles.howToOrderSection} aria-label="كيف تطلب">
        <h3 className={styles.stripTitle}>كيف تطلب من ويكس؟</h3>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepHeading}>اختر الجهاز</h4>
              <p className={styles.stepText}>تصفح المعروضات وتأكد من المواصفات والحالة المناسبة لاحتياجك.</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepHeading}>ثبّت السعر وحوّل</h4>
              <p className={styles.stepText}>
                بنثبت ليك سعر الصرف لمدة {shopInfo?.price_lock_hours || 4} ساعات عند إتمام الطلب، وحوّل القيمة عبر بنكك.
              </p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepHeading}>استلم من المحل أو التوصيل</h4>
              <p className={styles.stepText}>استلام فوري من مول الواحة بأم درمان أو شحن مباشر لبابك.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Shop Info Block */}
      <section className={styles.shopInfoSection} aria-label="معلومات المتجر">
        <div className={styles.shopInfoCard}>
          <div className={styles.shopInfoMain}>
            <h3 className={styles.shopInfoTitle}>متجر ويكس تكنولوجي — أم درمان</h3>
            <p className={styles.shopInfoDesc}>
              محل أجهزة لابتوب وهواتف وملحقات في مول الواحة بأم درمان. نوفر أجهزة جديدة ومستعملة مع فحص دقيق وإمكانية المعاينة المباشرة قبل الاستلام.
            </p>
            <div className={styles.shopActions}>
              <a
                href="https://wa.me/249912345678"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <MessageCircle size={18} />
                <span>تواصل عبر واتساب</span>
              </a>
              <a
                href="https://maps.google.com/?q=Omdurman+Al+Waha+Mall"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapsBtn}
              >
                <MapPin size={18} />
                <span>موقعنا على الخريطة</span>
              </a>
            </div>
          </div>

          <div className={styles.shopDetailsList}>
            <div className={styles.detailRow}>
              <MapPin size={20} className={styles.detailIcon} />
              <div>
                <div className={styles.detailLabel}>الموقع</div>
                <div className={styles.detailValue}>مول الواحة — الشهداء — أم درمان</div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <Clock size={20} className={styles.detailIcon} />
              <div>
                <div className={styles.detailLabel}>ساعات العمل</div>
                <div className={styles.detailValue}>السبت - الخميس: 10:00 ص - 10:00 م | الجمعة: 4:00 م - 10:00 م</div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <Coins size={20} className={styles.detailIcon} />
              <div>
                <div className={styles.detailLabel}>سعر الصرف المعتمد</div>
                <div className={styles.detailValue}>
                  1 درهم = {shopInfo?.exchange_rate_sdg || 650} جنيه سوداني
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
