import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, HelpCircle, MessageCircle, Phone, MapPin, ShieldCheck, Clock } from 'lucide-react';
import styles from './FaqPage.module.css';

const FAQ_DATA = [
  {
    category: 'تثبيت السعر والحجز',
    items: [
      {
        q: 'كيف يعمل نظام تثبيت السعر بالجنيه السوداني؟',
        a: 'فور إتمام الطلب، يتم حجز الجهاز وتجميد سعره بالجنيه السوداني لمدة 4 ساعات كاملة. يضمن لك هذا النظام عدم تأثرك بأي تغير في أسعار العملات حتى تكمل التحويل البنكي بكل طمأنينة.',
      },
      {
        q: 'ماذا يحدث إذا انتهت مهلة الـ 4 ساعات دون رفع الإشعار؟',
        a: 'عند انتهاء المهلة دون استلام إشعار التحويل، يتم إلغاء الحجز تلقائياً لتوفير الجهاز لعملاء آخرين. يمكنك في أي وقت إعادة الطلب بالأسعار المحدثة بضغطة زر واحدة من سجل طلباتك.',
      },
    ],
  },
  {
    category: 'السداد عبر بنكك',
    items: [
      {
        q: 'كيف أقوم بالسداد عبر تطبيق بنكك؟',
        a: 'بعد تثبيت السعر، يظهر لك رقم حساب المتجر في بنك الخرطوم (بنكك). قم بنسخ رقم الحساب والتحويل عبر التطبيق، مع كتابة رقم الطلب في خانة الملاحظات، ثم التقط صورة للإشعار وارفعها من نفس صفحة الطلب.',
      },
      {
        q: 'هل يمكنني لصق صورة الإشعار مباشرة من الكمبيوتر؟',
        a: 'نعم، تدعم صفحة رفع الإشعار خاصية اللصق المباشر (Ctrl+V) أو السحب والإفلات، مما يسهل رفع لقطة الشاشة في ثوانٍ معدودة دون الحاجة لحفظ الملف.',
      },
      {
        q: 'كم يستغرق تأكيد إشعار التحويل؟',
        a: 'يقوم فريق المتجر بمطابقة العملية في كشف الحساب وتأكيد الطلب خلال دقائق معدودة خلال ساعات العمل الرسمية.',
      },
    ],
  },
  {
    category: 'المعاينة والفحص عند الاستلام',
    items: [
      {
        q: 'هل يتوفر ضمان أو فترة تجربة على الأجهزة؟',
        a: 'الأجهزة مستوردة ولا يتوفر ضمان مصنعي في السوق المحلي؛ يفحص العميل الجهاز ويعاينه بنفسه بدقة عند الاستلام في المتجر للتأكد من سلامة الشاشة والبطارية وكافة المكونات قبل الشراء.',
      },
      {
        q: 'هل يمكنني معاينة الجهاز وتشغيله قبل الاستلام؟',
        a: 'بالتأكيد. نرحب بزيارتك في المحل لمعاينة الجهاز واختبار أدائه وفحصه بالكامل مع فنيي المتجر قبل إتمام الاستلام.',
      },
    ],
  },
  {
    category: 'الموقع والتوصيل',
    items: [
      {
        q: 'أين يقع المحل وما هي أوقات العمل الرسمية؟',
        a: 'محلنا في مول الواحة، الشهداء، أم درمان. نستقبلكم يومياً من الساعة 9:00 صباحاً وحتى 9:00 مساءً طوال أيام الأسبوع.',
      },
      {
        q: 'هل يتوفر توصيل للخرطوم والولايات؟',
        a: 'نعم، يتوفر التوصيل السريع داخل أم درمان والخرطوم وبحري، كما نشحن للولايات عبر خطوط الشحن الموثوقة مع التغليف الآمن.',
      },
    ],
  },
];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (catIndex, itemIndex) => {
    const key = `${catIndex}-${itemIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return FAQ_DATA;

    return FAQ_DATA.map((cat) => {
      const matchedItems = cat.items.filter(
        (item) => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      );
      return {
        ...cat,
        items: matchedItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <header className={styles.heroHeader}>
        <div className={styles.iconCircle}>
          <HelpCircle size={32} className={styles.heroIcon} />
        </div>
        <h1 className={styles.title}>الأسئلة الشائعة</h1>
        <p className={styles.subtitle}>
          كل ما تحتاج معرفته عن آلية تثبيت الأسعار، السداد ببنكك، المعاينة، والاستلام والتوصيل.
        </p>

        {/* Search Input */}
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأسئلة الشائعة..."
            className={styles.searchInput}
            aria-label="البحث في الأسئلة الشائعة"
          />
        </div>
      </header>

      {/* Highlights Row */}
      <div className={styles.highlightsGrid}>
        <div className={styles.highlightCard}>
          <Clock size={20} className={styles.highlightIcon} />
          <div>
            <h3 className={styles.highlightTitle}>تثبيت السعر 4 ساعات</h3>
            <p className={styles.highlightDesc}>السعر مضمون بالجنيه ومحمي ضد تقلبات الصرف.</p>
          </div>
        </div>

        <div className={styles.highlightCard}>
          <ShieldCheck size={20} className={styles.highlightIcon} />
          <div>
            <h3 className={styles.highlightTitle}>معاينة وفحص مباشر</h3>
            <p className={styles.highlightDesc}>فحص الجهاز ومعاينته بنفسك قبل الشراء.</p>
          </div>
        </div>

        <div className={styles.highlightCard}>
          <MapPin size={20} className={styles.highlightIcon} />
          <div>
            <h3 className={styles.highlightTitle}>مول الواحة، أم درمان</h3>
            <p className={styles.highlightDesc}>مفتوح يومياً من 9:00 ص حتى 9:00 م.</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className={styles.faqList}>
        {filteredData.length === 0 ? (
          <div className={styles.noResults}>
            <p>لم نجد نتائج تطابق بحثك عن &quot;{searchQuery}&quot;</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchBtn}
            >
              عرض جميع الأسئلة
            </button>
          </div>
        ) : (
          filteredData.map((cat, catIdx) => (
            <section key={catIdx} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{cat.category}</h2>
              <div className={styles.itemsGroup}>
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key] || searchQuery.trim().length > 0;

                  return (
                    <article key={itemIdx} className={styles.accordionItem}>
                      <button
                        type="button"
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className={styles.accordionHeader}
                        aria-expanded={isOpen}
                      >
                        <span className={styles.questionText}>{item.q}</span>
                        <ChevronDown
                          size={18}
                          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className={styles.accordionBody}>
                          <p className={styles.answerText}>{item.a}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Support Card */}
      <div className={styles.supportCard}>
        <div className={styles.supportInfo}>
          <h3 className={styles.supportTitle}>هل لديك سؤال آخر؟</h3>
          <p className={styles.supportDesc}>
            فريق متجر ويكس تكنولوجي متاح يومياً لمساعدتك والإجابة على أي استفسار.
          </p>
        </div>

        <div className={styles.supportActions}>
          <a
            href="https://wa.me/249912345678"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappBtn}
          >
            <MessageCircle size={16} />
            <span>تواصل عبر واتساب</span>
          </a>

          <a href="tel:+249912345678" className={styles.callBtn}>
            <Phone size={16} />
            <span>اتصال هاتفي</span>
          </a>
        </div>
      </div>
    </div>
  );
}
