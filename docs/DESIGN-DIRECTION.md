# التوجه التصميمي العام — متجر ويكس تكنولوجي (Design Direction)
**الهدف:** متجر إلكتروني يشعر العميل أنه **صُنع بيدي فريق المحل في أم درمان**، ينبض بالحياة، أنيق، واحترافي بنسبة 100%.

---

## 1. المفهوم البصري والروحي (The Visual Concept)
- **الهوية:** متجر تقني سوداني واقعي في قلب أم درمان (مول الواحة - الشهداء)، يتميز بالدفء، الوضوح، والمصداقية العالية.
- **الطاقة البصرية:** مزيج متناغم بين الأزرق الملكي الداكن الوقور (`#061A55`)، الأزرق الملكي الحيوي (`#0B3FBF`)، الأزرق النابض (`#1E6BFF`)، ولمسات السماوي المضيئة (`#00B7FF`) على خلفية جليدية نقية ومريحة للعين (`#EAF3FF`).
- **الملمس (Tactility):** بطاقات بيضاء ناصعة ذات ظلال زرقاء خفيفة ومصبوغة (`rgba(6, 26, 85, 0.06 - 0.12)`) بدلاً من الظلال الرمادية الباهتة، بحواف مستديرة مريحة (14px للضوابط، 16px-20px للكروت، 28px للبطاقات البارزة)، تعطي إحساساً طبقاتياً ثلاثي الأبعاد دون تعقيد.
- **الرموز البصرية المميزة:** الأشرطة المائلة بزاوية 115°-135° المستوحاة من زاوية حرف X وسهمه المضيء في الشعار كخلفيات حية وفواصل للأقسام وبوسترات الخصم، مع استخدام علامة X كعلامة مائية ناعمة في شاشات التحميل والحالات الفارغة.

---

## 2. ما الذي يجعل هذا التصميم غير مولّد بالذكاء الاصطناعي (What Makes This NOT Look AI-Made)
1. **تجنب التدرجات البنفسجية/الوردية المستهلكة (No AI Purple Gradients):** الالتزام الحرفي بنظام ألوان ويكس الرسمي (Royal / Vivid / Cyan / Navy / Ice).
2. **انعدام الإيموجيز كأيقونات (Zero Emojis as UI Icons):** استخدام منظومة أيقونات متجهة (SVG) دقيقة ومتناسقة السمك (1.75 stroke) ومحاذاة بعناية مع الخط العربي.
3. **تنوع الإيقاع البصري للشاشات (Rhythm Variation):** الابتعاد عن شبكات الكروت المتماثلة المملة، وتقديم إيقاع غني يجمع بين:
   - أشرطة مائلة بعرض الشاشة بالكامل (Full-bleed ribbons).
   - دوائر تصنيفات أفقية قابلة للتمرير السلس (Category Bubbles).
   - بطاقات عريضة تحتوي على كبسولات تفصيلية دقيقة (Spec pills: معالج، رام، تخزين).
   - شريط تفاعلي عائم للأسعار وتأكيد الطلب.
4. **حضور المحل والواقع السوداني في كل تفصيلة:**
   - العنوان الفعلي في مول الواحة - الشهداء ومواعيد العمل الحقيقية وزر الواتساب المباشر ورابط الموقع.
   - سير عمل التحويل عبر تطبيق "بنكك" لبنك الخرطوم مع أزرار نسخ فورية ومساحة لرفع إشعار التحويل وتأكيده.
   - عرض السعر المرجعي بالدرهم الإماراتي مع سعر الصرف بالجنيه وعداد تثبيت السعر، دون ادعاءات تسويقية زائفة أو وعود غير حقيقية.
5. **العناية بالتفاصيل الدقيقة (Micro-delights):**
   - وميض نبضي أخضر لشريحة الصرف المحدثة فورياً.
   - عداد تنازلي بأرقام واضحة ذات عرض رقمي ثابت (`tabular-nums`) ونقطتين وامضتين.
   - أزرار ذات تغذية راجعة باللمس السريع (`transform: scale(0.97)`).
   - انزلاق انسيابي لمؤشر التبويب السفلي بين الأقسام.

---

## 3. منظومة التوكنز المطورة المتوافقة (Revised & Backward-Compatible Token Set)

```css
:root {
  /* =========================================================================
     1. Brand Palette & Contrast-Compliant Core Colors
     ========================================================================= */
  --wex-navy: #061A55;             /* Dark navy: text, dark cards, footer */
  --wex-royal: #0B3FBF;            /* Royal blue: primary buttons, links, active tab */
  --wex-vivid: #1E6BFF;            /* Vivid blue: focus rings, interactive states, middle gradient */
  --wex-cyan: #00B7FF;             /* Bright cyan: small accents, rate pulse, ring end, ribbon streak */
  --wex-ice: #EAF3FF;              /* Ice blue: page background, subtle pills */
  --wex-ice-light: #F4F8FE;        /* Ice light: secondary surfaces, inner card containers */
  --wex-white: #FFFFFF;            /* Pure white: primary content cards, sheets */

  /* Derived Neutrals */
  --wex-text-secondary: #4B5B85;   /* Secondary descriptive text (Contrast >= 5.9:1 on ice, 6.7:1 on white) */
  --wex-border: #D5E2F7;           /* Subtle card & input borders */
  --wex-disabled: #9AA8C7;         /* Disabled elements */

  /* Dark Card Tokens */
  --on-dark: #FFFFFF;              /* Pure white text on navy/royal */
  --on-dark-muted: #C9D6F5;        /* Soft ice text on dark surfaces (Contrast >= 11:1) */

  /* Status Colors */
  --wex-success: #12805C;
  --wex-warning: #B45309;
  --wex-danger: #B42318;
  --wex-success-bg: #E8F5EE;
  --wex-warning-bg: #FEF3E2;
  --wex-danger-bg: #FEE8E7;

  /* =========================================================================
     2. Brand Gradients (Official Brand Guidelines)
     ========================================================================= */
  --wex-grad-brand: linear-gradient(135deg, #0B3FBF 0%, #1E6BFF 50%, #00B7FF 100%);
  --wex-grad-ribbon: linear-gradient(115deg, rgba(11, 63, 191, 0.95) 0%, rgba(30, 107, 255, 0.90) 60%, rgba(0, 183, 255, 0.85) 100%);
  --wex-grad-navy: linear-gradient(135deg, #061A55 0%, #0B3FBF 100%);
  --wex-grad-royal-navy: linear-gradient(135deg, #0B3FBF 0%, #061A55 100%);
  --wex-grad-surface: linear-gradient(180deg, #FFFFFF 0%, #EAF3FF 100%);

  /* =========================================================================
     3. Spacing Scale & Full Backward Compatibility Aliases
     ========================================================================= */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Backward compatibility for store modules using --wex-space-* */
  --wex-space-4: 4px;
  --wex-space-8: 8px;
  --wex-space-12: 12px;
  --wex-space-16: 16px;
  --wex-space-24: 24px;
  --wex-space-32: 32px;
  --wex-space-48: 48px;

  --page-padding: 16px;
  --section-gap: 24px;

  /* =========================================================================
     4. Border Radii & Aliases
     ========================================================================= */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-control: 12px;
  --radius-md: 14px;
  --radius-card: 16px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-chip: 999px;
  --radius-full: 999px;

  /* Aliases for store modules */
  --wex-radius-8: 8px;
  --wex-radius-12: 12px;
  --wex-radius-16: 16px;
  --wex-radius-20: 20px;
  --wex-radius-28: 28px;
  --wex-radius-chip: 999px;
  --wex-radius-full: 999px;

  /* =========================================================================
     5. Typography & Font Sizes
     ========================================================================= */
  --font-arabic: 'Tajawal', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family: var(--font-arabic);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --text-caption: 12px;
  --text-small: 14px;
  --text-body: 16px;
  --text-title: 18px;
  --text-heading: 22px;
  --text-display: 28px;

  /* Aliases for store modules */
  --wex-fs-caption: 12px;
  --wex-fs-small: 14px;
  --wex-fs-body: 16px;
  --wex-fs-title: 18px;
  --wex-fs-heading: 22px;
  --wex-lh-heading: 1.35;
  --wex-lh-body: 1.7;
  --wex-lh-normal: 1.5;

  /* Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  --weight-hero: 800;

  /* =========================================================================
     6. Tactile Blue-Tinted Shadows (Restored Richness)
     ========================================================================= */
  --shadow-none: none;
  --shadow-sm: 0 2px 6px rgba(6, 26, 85, 0.05);
  --shadow-md: 0 8px 20px rgba(6, 26, 85, 0.08);
  --shadow-lg: 0 16px 32px rgba(6, 26, 85, 0.12);
  --shadow-floating: 0 12px 30px rgba(30, 107, 255, 0.22);
  --shadow-float: var(--shadow-floating);
  --shadow-toast: 0 8px 24px rgba(6, 26, 85, 0.14);
  --shadow-sheet: 0 -8px 30px rgba(6, 26, 85, 0.12);
  --shadow-sticky: 0 -4px 16px rgba(6, 26, 85, 0.06);

  /* =========================================================================
     7. App Shell & Layout Missing Dimensions
     ========================================================================= */
  --sidebar-width: 260px;
  --header-height: 64px;
  --app-shell-max-width: 480px;
  --tablet-max-width: 768px;
  --desktop-max-width: 1240px;
  --app-bar-height: 56px;
  --bottom-tab-height: 56px;
  --bottom-offset: 68px;
  --touch-target: 48px;

  /* =========================================================================
     8. Motion Tokens
     ========================================================================= */
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --wex-motion-duration: 250ms;
  --wex-motion-easing: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-emphasized: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 4. قائمة المكونات المحدثة والمعاد بناؤها (Component Architecture)

1. **المكونات الأساسية المشتركة (Base Primitives):**
   - `Button`: أنماط أساسية وثانوية ومفرغة (primary, secondary, outline, ghost) مع حالة ضغط تفاعلية وقياس 48px.
   - `Card` & `DarkCard`: كروت ذات أسطح نقية، ظلال مصبوغة، زوايا 16px/20px، وتدرجات معتمدة.
   - `Chip`: كبسولات تصفية بحواف 999px وحالات نشطة مميزة.
   - `Input`, `Select`, `Textarea`: حقول إدخال بارتفاع 48px، حلقة تركيز سماوية-نابضة، ودعم ذكي للأرقام والاتجاهات (`dir="ltr"` مع محاذاة النص والملصق لليمين).
   - `Sheet`: ورقة سفلية تنبثق بسلاسة مع خلفية معتمة قابلة للسحب والإغلاق.
   - `Toast`: إشعارات فورية مع زر تراجع (Undo) وتنبيه صوتي/بصري ناعم.
   - `StickyBar`: شريط عائم سفلي ذو حواف مستديرة ومراعاة تامة للـ `env(safe-area-inset-bottom)`.
   - `AppBar` & `BottomTabBar`: شريط علوي مع الشعار وشريط سفلي بمؤشر منزلق ونبض للأيقونة النشطة دون ترك فجوة بيضاء.

2. **مكونات المتجر المتخصصة (Storefront Specifics):**
   - `ProductImage`: خط أنابيب ذكي لعرض صور المنتجات الحقيقية، مع وسوم `srcset`, `loading="lazy"`, وأبعاد ثابتة (4:3 للكروت، 1:1 للتفاصيل) لمنع القفزات البصرية (CLS)، ورسم توضيحي ملون بهوية المتجر (لابتوب / هاتف / ملحق) وعلامة X مائية عند غياب الصورة.
   - `PriceLockCard`: بطاقة تثبيت السعر الداكنة بتدرج كحلي-ملكي فخم، عداد رقمي عريض، نقطتين وامضتين، وحالة عاجلة ملفتة عند بقاء أقل من 15 دقيقة.
   - `BankDetailsCard`: بطاقة حساب بنك الخرطوم (تطبيق بنكك) مع أزرار نسخ فورية وتغذية راجعة فورية ("تم النسخ").
   - `ReceiptDropzone`: منطقة تفاعلية لرفع إشعار بنكك مع معاينة مصغرة ومؤشر تقدم ضغط الصورة قبل الإرسال.
   - `TrackingTimeline`: جدول تتبع الطلب المتدرج مع نبض للخطوة الحالية.
   - `CategoryBubbles`: شريط فقاعات أفقية دائرية سريعة الحركة للتنقل بين الأقسام.

3. **الحركات والتفاعلات (Motion Language):**
   - اقتصار الحركة على `transform` و `opacity` فقط لأعلى كفاءة على معالجات الموبايل (60fps).
   - دعم كامل لتفضيل تقليل الحركة (`prefers-reduced-motion`) ووضع الأجهزة الاقتصادية المحدودة (`navigator.deviceMemory <= 2` أو `hardwareConcurrency <= 4`).
