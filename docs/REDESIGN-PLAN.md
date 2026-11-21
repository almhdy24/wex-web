# خطة تنفيذ إعادة التصميم الشاملة — متجر ويكس تكنولوجي (Implementation Plan)
**الفرع:** `stabilize` | **البيئة:** React 19 + Vite + CSS Modules (Arabic RTL PWA)

---

## 1. جدول التناقضات المعتمد (Conflicts List)
تم حسم جميع التعارضات بين `tokens.css` والكتيب والنموذج لصالح **الكتيب والنموذج المعتمد**:
1. **تدرج العلامة:** اعتماد تدرج ويكس الكامل (`linear-gradient(135deg, #0B3FBF 0%, #1E6BFF 50%, #00B7FF 100%)`).
2. **الظلال:** اعتماد ظلال زرقاء مصبوغة ناعمة (`rgba(6, 26, 85, 0.05 - 0.12)`).
3. **اللون السماوي:** مسموح به كلمسة إبراز وتمييز بنسبة صغيرة (سهم الانطلاق، وميض التحديث، حلقة العداد، خلفيات الأيقونات).
4. **أوزان الخطوط:** 400 (عادي)، 500 (متوسط)، 700 (عريض)، 800 (عريض فائق للهيرو والأسعار).
5. **استدارة الكروت:** مقياس مرن (12px للضوابط، 16px/20px للكروت، 28px للبطاقات البارزة).
6. **المتغيرات المفقودة:** تعريف وتضمين `--sidebar-width: 260px` و `--header-height: 64px` وجميع متغيرات مسافات وأحجام المتجر القديمة (`--wex-space-*`, `--wex-fs-*`, `--wex-radius-*`) كتحويلات متوافقة في `tokens.css`.

---

## 2. مراحل التنفيذ والمكونات والملفات (Phased Implementation)

### 📌 المرحلة 1: التوكنز، الأنماط العامة، غلاف التطبيق، والمكونات الأساسية (Phase 1: Shell & Primitives)
- **الأهداف:**
  - تحديث `src/styles/tokens.css` لإعادة التدرجات، الظلال، الأوزان، والمتغيرات الناقصة.
  - ضبط `src/styles/global.css` (الخطوط، خواص RTL المنطقية، حلقات التركيز، وتجاوب لوحة المفاتيح).
  - إصلاح مشاكل الأبعاد في `src/layouts/AdminLayout.module.css` و `src/layouts/StoreLayout.module.css`.
  - معالجة الفجوة البيضاء أسفل شريط التبويب السفلي وتعديل منطق `--bottom-offset` و `env(safe-area-inset-bottom)`.
  - إعادة بناء وتنسيق المكونات المشتركة: `Button`, `Card`, `DarkCard`, `Chip`, `Input`, `Select`, `Sheet`, `Toast`, `Skeleton`, `EmptyState`, `StickyBar`, `AppBar`, `BottomTabBar`, `NoticeLine`.
  - إزالة تكرار العناوين المزدوجة (إلغاء H1 المتكرر أسفل AppBar).
  - تحديث اختبارات `design-system.test.jsx` لتتوافق مع القواعد الجديدة دون حذف أي فحص.
- **الملفات المعنية:**
  - `src/styles/tokens.css`
  - `src/styles/global.css`
  - `src/layouts/StoreLayout.jsx`
  - `src/layouts/StoreLayout.module.css`
  - `src/layouts/AdminLayout.module.css`
  - `src/components/common/Button.jsx` & `Button.module.css`
  - `src/components/common/Card.jsx` & `Card.module.css`
  - `src/components/common/DarkCard.jsx` & `DarkCard.module.css`
  - `src/components/common/Chip.jsx` & `Chip.module.css`
  - `src/components/common/Input.jsx` & `Input.module.css`
  - `src/components/common/Select.jsx` & `Select.module.css`
  - `src/components/common/Sheet.jsx` & `Sheet.module.css`
  - `src/components/common/StickyBar.jsx` & `StickyBar.module.css`
  - `src/components/common/AppBar.jsx` & `AppBar.module.css`
  - `src/components/common/BottomTabBar.jsx` & `BottomTabBar.module.css`
  - `src/components/common/Toast.jsx` & `Toast.module.css`
  - `src/__tests__/design-system.test.jsx`

---

### 📌 المرحلة 2: الصفحة الرئيسية، المعرض، وتفاصيل المنتج (Phase 2: Home, Catalog & Detail)
- **الأهداف:**
  - **الصفحة الرئيسية (`HomePage`):** ترحيب دافئ، شريحة سعر الصرف النابضة، شريط الهيرو المتدرج والشرائح المتحركة، فقاعات التصنيفات الدائرية القابلة للتمرير، شريط خصم 3% للطلب بالتطبيق، شرائط المنتجات الأفقية، شريط شعارات العلامات، بلوك تفاصيل المحل الحقيقية (مول الواحة - الشهداء، الخريطة، والواتساب).
  - **المعرض (`CatalogPage`):** فلاتر سريعة بنصف قطر 999px، تصنيف الحالة (جديد / مستعمل استيراد)، ورقة ترتيب أنيقة (Sort Sheet)، كروت منتجات جذابة بنسب 4:3 وكبسولات مواصفات متقنة.
  - **تفاصيل المنتج (`ProductDetailPage`):** خط أنابيب `ProductImage` للصور الحقيقية أو الرسوم التوضيحية الغنية، شريط الصور المصغرة، تكبير الصورة (`ImageViewer`)، كبسولات المواصفات المنظمة، شريط التبويب المقسم (Segmented Control)، والشريط السفلي العائم للشراء.
  - بناء خط أنابيب الصور المتقدم `ProductImage` و `ProductTypeSvg`.
- **الملفات المعنية:**
  - `src/pages/store/HomePage.jsx` & `HomePage.module.css`
  - `src/pages/store/CatalogPage.jsx` & `CatalogPage.module.css`
  - `src/pages/store/ProductDetailPage.jsx` & `ProductDetailPage.module.css`
  - `src/components/products/ProductCard.jsx` & `ProductCard.module.css`
  - `src/components/common/ProductImage.jsx`
  - `src/components/common/ProductTypeSvg.jsx`

---

### 📌 المرحلة 3: سلة المشتريات، إتمام الطلب، تثبيت السعر، وتتبع الطلبات (Phase 3: Cart, Checkout, Lock & Orders)
- **الأهداف:**
  - **سلة المشتريات (`CartPage`):** تباعدات مريحة وهوامش كروت متناسقة، عدادات كمية بمساحة 48px، حذف الجهاز مع إشعار تراجع فوري (Undo Toast)، كارت ملخص السعر وشريط المتابعة العائم بحواف مستديرة ومراعاة أمان الشاشة.
  - **إتمام الطلب (`CheckoutPage`):** مؤشر خطوات الطلب (Stepper: الاستلام → التواصل → المراجعة)، كروت خيارات الاستلام بأيقونات واضحة وحالات نشطة مميزة، حقل الهاتف المنسق للشبكات السودانية مع محاذاة النص والملصق لليمين، شريط التأكيد المتكيف مع لوحة المفاتيح.
  - **بطاقة تثبيت السعر والسداد (`OrderDetailPage`):** بطاقة تثبيت السعر الداكنة ذات التدرج الفخم، أرقام العداد التنازلي الكبيرة بنمط `tabular-nums` ونقطتين وامضتين، كارت حساب بنك الخرطوم (تطبيق بنكك) مع أزرار نسخ فورية وتغذية راجعة، منطقة رفع الإشعار (Receipt Dropzone) مع معاينة مصغرة ومؤشر ضغط، وشريط التتبع الزمني المتدرج بنبض الخطوة الحالية.
  - **قائمة الطلبات (`OrdersPage`):** كروت طلبات أنيقة مع شارات الحالات وتدرجات الألوان المناسبة.
- **الملفات المعنية:**
  - `src/pages/store/CartPage.jsx` & `CartPage.module.css`
  - `src/pages/store/CheckoutPage.jsx` & `CheckoutPage.module.css`
  - `src/pages/store/OrderDetailPage.jsx` & `OrderDetailPage.module.css`
  - `src/pages/store/OrdersPage.jsx` & `OrdersPage.module.css`
  - `src/components/common/Countdown.jsx` & `Countdown.module.css`

---

### 📌 المرحلة 4: المفضلة، المقارنة، الحساب، الإشعارات، والأسئلة الشائعة (Phase 4: Secondary Pages)
- **الأهداف:**
  - **المفضلة (`FavoritesPage`):** تصغير حجم الصورة للكارت لتتناسب بشكل رشيق، منع حجب أزرار الإجراءات بالتبويب السفلي عبر ضبط الهامش السفلي، زر إضافة الكل للسلة.
  - **المقارنة (`ComparePage`):** جدول مقارنة متجاوب مع تثبيت عمود العناوين وتأثيرات التمييز.
  - **الحساب (`AccountPage`):** بطاقة بروفايل دافئة، اختصارات سريعة لطلباتي، عناوين الاستلام، ومفتاح واتساب مباشر للدعم.
  - **الإشعارات والأسئلة الشائعة وتوثيق الدخول (`NotificationsPage`, `FaqPage`, `LoginPage`, `VerifyOtpPage`):** أكورديون سلس للأسئلة الشائعة وتنسيق مريح لشاشات تسجيل الدخول والـ OTP المتكيفة مع لوحة المفاتيح.
- **الملفات المعنية:**
  - `src/pages/store/FavoritesPage.jsx` & `FavoritesPage.module.css`
  - `src/pages/store/ComparePage.jsx` & `ComparePage.module.css`
  - `src/pages/store/AccountPage.jsx` & `AccountPage.module.css`
  - `src/pages/store/NotificationsPage.jsx` & `NotificationsPage.module.css`
  - `src/pages/store/FaqPage.jsx` & `FaqPage.module.css`
  - `src/pages/store/LoginPage.jsx` & `src/pages/store/VerifyOtpPage.jsx`

---

### 📌 المرحلة 5: تحسين شاشات سطح المكتب والعرض الواسع (Phase 5: Desktop ≥ 1024px)
- **الأهداف:**
  - تحسين شريط التنقل العلوي لسطح المكتب (`DesktopHeader`) والفوتر (`StoreFooter`).
  - تحسين درج السلة المنزلق (`CartDrawer`) وشبكة عرض المنتجات.
  - ضبط استجابة الصفحات للمقاسات العريضة لتظهر بهيبة وفخامة تليق بالمتجر.
- **الملفات المعنية:**
  - `src/components/desktop/DesktopHeader.jsx` & `.module.css`
  - `src/components/desktop/CartDrawer.jsx` & `.module.css`
  - `src/components/store/StoreFooter.jsx` & `.module.css`

---

### 📌 المرحلة 6: صقل لوحة الإدارة (Phase 6: Admin Polish)
- **الأهداف:**
  - الحفاظ على هدوء وفاعلية واجهات الإدارة مع منحها نفس روح العلامة الاحترافية.
  - ضبط جداول البيانات، البطاقات، كبسولات الحالات، والنماذج.
- **الملفات المعنية:**
  - `src/layouts/AdminLayout.jsx` & `AdminLayout.module.css`
  - `src/components/admin/*`
  - `src/pages/admin/*`

---

### 📌 المرحلة 7: صلابة الـ PWA، الأداء، والاختبارات الشاملة (Phase 7: PWA Hardening & Verification)
- **الأهداف:**
  - مراجعة ملف الـ `manifest.webmanifest` والـ Service Worker والتخزين المؤقت للأصول والخطوط.
  - تحسين وسوم iOS و `viewport-fit=cover`.
  - فحص ميزانية الأداء (LCP < 2.5s, CLS < 0.1).
  - التأكد من اجتياز كامل الاختبارات: `npm run lint`, `npm test`, `npm run build`.
  - إنتاج وثيقة `docs/ASSETS-NEEDED.md` للملفات والصور المطلوبة من صاحب المتجر.
- **الملفات المعنية:**
  - `vite.config.js`
  - `index.html`
  - `public/manifest.webmanifest`
  - `docs/ASSETS-NEEDED.md`
