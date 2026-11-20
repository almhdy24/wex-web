/**
 * Central Modern Standard Arabic (الفصحى المعاصرة الميسرة) Dictionary
 * All customer-visible storefront copy resides strictly in this file.
 *
 * Rules:
 * - Western digits only (0-9).
 * - No marketing puffery: strictly prohibited promotional superlatives.
 * - Zero emojis, zero exclamation marks.
 * - Never mention reference currency (AED, dirham, dollar) or numerical rates.
 */

export const ar = {
  common: {
    appName: 'ويكس تكنولوجي',
    appSubtitle: 'متجر الحواسيب والإلكترونيات',
    loading: 'جاري التحميل...',
    retry: 'إعادة المحاولة',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    back: 'رجوع',
    close: 'إغلاق',
    copy: 'نسخ',
    copied: 'تم النسخ',
    all: 'الكل',
    viewAll: 'عرض الكل',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    sdg: 'ج.س',
    currencyUnit: 'جنيه سوداني',
    free: 'مجانًا',
    quantity: 'الكمية',
    itemsCount: '{count} أجهزة',
    singleItem: 'جهاز واحد',
    twoItems: 'جهازان',
    threeToTenItems: '{count} أجهزة',
    moreItems: '{count} جهازًا',
    offlineTitle: 'لا يوجد اتصال بالشبكة',
    offlineDesc: 'يُرجى التحقق من اتصالك بالإنترنت للمتابعة.',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundDesc: 'عذرًا، لم يتم العثور على الصفحة المطلوبة.',
    errorGeneric: 'حدث خطأ غير متوقع، يُرجى المحاولة مرة أخرى.',
    connectionError: 'تعذّر الاتصال، يُرجى المحاولة مرة أخرى.',
  },

  navigation: {
    home: 'الرئيسية',
    catalog: 'المتجر',
    accessories: 'الملحقات',
    orders: 'طلباتي',
    account: 'حسابي',
    cart: 'السلة',
    notifications: 'التنبيهات',
    adminDashboard: 'لوحة التحكم',
    backToHome: 'العودة للرئيسية',
    backToCatalog: 'العودة للمتجر',
    backToOrders: 'العودة إلى طلباتي',
  },

  desktop: {
    statusOpen: 'مفتوح الآن',
    statusClosed: 'مغلق حاليًا',
    shopHoursShort: 'السبت - الخميس: 9:00 ص - 9:00 م',
    locationShort: 'مول الواحة، الشهداء، أم درمان',
    phone: '+249 91 234 5678',
    whatsapp: 'تواصل عبر واتساب',
    searchPlaceholder: 'ابحث عن جهاز، ماركة، أو ملحقات...',
    notificationsTitle: 'أحدث التنبيهات',
    noNotifications: 'لا توجد تنبيهات جديدة',
    viewAllNotifications: 'عرض جميع التنبيهات',
    cartDrawerTitle: 'سلة المشتريات',
    cartEmpty: 'سلتك فارغة حاليًا',
    cartSubtotal: 'المجموع الفرعي',
    appDiscount: 'خصم المتجر (3%)',
    cartTotal: 'الإجمالي',
    proceedCheckout: 'متابعة الطلب',
    viewFullCart: 'عرض السلة كاملة',
    continueShopping: 'تصفّح الأجهزة',
    accountMenu: 'قائمة الحساب',
    guestUser: 'زائر',
    loginNow: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    myOrders: 'طلباتي',
    profile: 'بيانات الحساب',
    settings: 'إعدادات العرض',
    footer: {
      aboutShop: 'مقرنا في مول الواحة بأم درمان نوفر أحدث الحواسيب والملحقات بأسعار مثبتة وشفافة.',
      quickLinks: 'روابط سريعة',
      contactUs: 'تواصل معنا',
      howToOrder: 'كيف تطلب',
      faq: 'الأسئلة الشائعة',
      privacyPolicy: 'سياسة الخصوصية والضمان',
      step1: '1. اختر الجهاز المناسب',
      step2: '2. ثبّت السعر عند الطلب',
      step3: '3. حوّل عبر بنكك وارفع الإشعار',
      step4: '4. استلم جهازك بالضمان',
      copyright: 'جميع الحقوق محفوظة © {year} ويكس تكنولوجي.',
    },
  },

  splash: {
    title: 'ويكس تكنولوجي',
    subtitle: 'حواسيب وإلكترونيات بأم درمان',
    location: 'مول الواحة - الشهداء',
    skip: 'تخطي والدخول',
  },

  priceNotice: {
    full: 'الأسعار تتغيّر مع تقلّب سعر الصرف. عند إتمام الطلب نثبّت لك السعر لمدة {hours} ساعات لتتمكّن من التحويل.',
    short: 'الأسعار تتغيّر مع تقلّب سعر الصرف. نثبّت لك السعر لمدة {hours} ساعات بعد إتمام الطلب.',
    pricesUpdatedAt: 'آخر تحديث للأسعار: {time}',
    pricesUpdatedToday: 'محدثة اليوم',
  },

  home: {
    greetingGuest: 'أهلاً بك في ويكس',
    greetingUser: 'أهلاً بك، {name}',
    searchPlaceholder: 'ابحث عن جهاز، مثل: Dell Latitude',
    searchPlaceholderExamples: [
      'ابحث عن جهاز، مثل: Dell Latitude',
      'ابحث عن جهاز، مثل: Lenovo ThinkPad',
      'ابحث عن جهاز، مثل: HP EliteBook',
      'ابحث عن ملحقات، مثل: شاحن حاسوب',
    ],
    recentSearches: 'عمليات البحث الأخيرة',
    popularSearches: 'الأكثر بحثًا',
    hero: {
      slide1Title: 'أحدث الحواسيب المحمولة',
      slide1Subtitle: 'أجهزة مختارة بعناية لتناسب دراستك وعملك',
      slide1Cta: 'تصفّح الأجهزة الجديدة',
      slide2Title: 'ثبّت السعر عند الطلب',
      slide2Subtitle: 'مهلة 4 ساعات لإتمام التحويل دون تأثر بتغيّر الأسعار',
      slide2Cta: 'كيف يعمل تثبيت السعر؟',
      slide3Title: 'ملحقات حاسوبك الأساسية',
      slide3Subtitle: 'شواحن، حقائب، وماوسات متوافقة مع جهازك',
      slide3Cta: 'استعرض الملحقات',
    },
    quickActions: {
      browse: 'تصفّح الأجهزة',
      track: 'تتبّع طلبي',
      whatsapp: 'تواصل عبر واتساب',
      location: 'موقع المحل',
    },
    categories: {
      laptops: 'حواسيب محمولة',
      phones: 'هواتف',
      accessories: 'ملحقات',
      conditionNew: 'جديد',
      conditionUsed: 'مستعمل استيراد',
    },
    rails: {
      newArrivals: 'وصل حديثًا',
      study: 'مناسبة للدراسة',
      work: 'مناسبة للعمل',
      accessories: 'ملحقات مختارة',
      viewAll: 'عرض الكل',
    },
    howToOrder: {
      title: 'كيف تطلب من ويكس؟',
      subtitle: 'أربع خطوات بسيطة لاستلام جهازك بأمان',
      step1Title: 'اختر الجهاز',
      step1Desc: 'تصفّح المواصفات الفنية واختر ما يناسبك.',
      step2Title: 'ثبّت السعر',
      step2Desc: 'أرسل طلبك لحجز الجهاز وتثبيت السعر لمدة 4 ساعات.',
      step3Title: 'حوّل المبلغ وارفع الإشعار',
      step3Desc: 'حوّل المبلغ عبر تطبيق بنكك وارفع صورة الإشعار.',
      step4Title: 'استلم جهازك',
      step4Desc: 'استلم من مقرنا بمول الواحة أو يصلك مع المندوب.',
    },
    shopInfo: {
      title: 'مقر ويكس تكنولوجي',
      address: 'أم درمان، الشهداء، مول الواحة، الطابق الأرضي',
      hours: 'السبت إلى الخميس: 9:00 ص حتى 9:00 م',
      openHoursNote: 'الجمعة عطلة أسبوعية',
      callOrChat: 'تواصل مع فريق المبيعات',
      openMap: 'عرض على الخريطة',
      whatsappChat: 'مراسلة عبر واتساب',
    },
    floatingWhatsapp: 'تواصل مع خدمة العملاء',
  },

  product: {
    conditionNew: 'جديد',
    conditionUsed: 'مستعمل استيراد',
    conditionRefurbished: 'مجدد',
    conditionOpenBox: 'كرتونة مفتوحة',
    stockAvailable: 'متوفر بالمخزون: {count}',
    stockLow: 'متبقي {count} أجهزة فقط',
    outOfStock: 'غير متوفر حاليًا',
    quickAdd: 'أضف للسلة',
    addedToCart: 'تمت الإضافة للسلة',
    inCart: 'موجود بالسلة',
    specifications: 'المواصفات الفنية',
    warranty: 'الضمان المعتمد',
    warrantyDefault: 'ضمان فحص وتشغيل معتمد لمدة 7 أيام',
    pickupPolicy: 'استلام فوري من المحل أو توصيل لجميع الولايات',
    description: 'تفاصيل الجهاز والفحص',
    suggestedAccessories: 'ملحقات ملائمة لجهازك',
    addAccessory: 'إضافة الملحق',
    orderNowAndLock: 'تثبيت السعر وإتمام الطلب',
    addToCartAction: 'إضافة إلى السلة',
  },

  catalog: {
    title: 'متجر الأجهزة',
    subtitle: 'حواسيب وملحقات تقنية بفحص فني دقيق',
    searchPlaceholder: 'ابحث بالاسم أو الماركة أو المعالج...',
    resultsCount: '{count} نتائج مطابقة',
    noResultsTitle: 'لم نعثر على أجهزة مطابقة',
    noResultsDesc: 'جرّب تعديل معايير البحث أو التصفية.',
    resetFilters: 'إعادة ضبط التصفية',
    filterByBrand: 'الماركة',
    filterByCategory: 'النوع',
    filterByCondition: 'الحالة',
    filterByPrice: 'نطاق السعر (ج.س)',
    sortTitle: 'الترتيب',
    sortNewest: 'الأحدث أولاً',
    sortPriceAsc: 'السعر: من الأقل إلى الأعلى',
    sortPriceDesc: 'السعر: من الأعلى إلى الأقل',
    priceMin: 'الحد الأدنى',
    priceMax: 'الحد الأقصى',
    applyFilters: 'تطبيق التصفية',
  },

  cart: {
    title: 'سلة المشتريات',
    emptyTitle: 'سلتك فارغة',
    emptyDesc: 'لم تضف أي جهاز إلى سلتك بعد.',
    startShopping: 'تصفّح الأجهزة الآن',
    itemCount: '{count} عناصر',
    unitPrice: 'سعر القطعة:',
    totalItemPrice: 'المجموع:',
    removeItem: 'إزالة الجهاز',
    subtotal: 'المجموع الفرعي:',
    appDiscount: 'خصم التطبيق المباشر (3%):',
    estimatedTotal: 'الإجمالي التقديري:',
    proceedToCheckout: 'متابعة إتمام الطلب',
    priceChangedAlertTitle: 'تغير سعر هذا الجهاز',
    priceChangedOld: 'السعر السابق: {oldPrice} ج.س',
    priceChangedNew: 'السعر المحدث: {newPrice} ج.س',
    confirmPriceChanges: 'موافق على الأسعار المحدثة',
    mustConfirmPriceNotice: 'يرجى تأكيد الأسعار المحدثة قبل إتمام الطلب.',
    maxQuantityReached: 'الحد الأقصى لكل طلب هو 10 قطع.',
  },

  checkout: {
    title: 'إتمام الطلب وتثبيت السعر',
    step1Title: '1. طريقة الاستلام',
    step2Title: '2. بيانات التواصل والعنوان',
    step3Title: '3. ملخص الحساب والتأكيد',
    pickupOption: 'استلام من المحل (مجاني)',
    pickupDesc: 'أم درمان - الشهداء - مول الواحة',
    deliveryOption: 'توصيل عبر المندوب',
    deliveryDesc: 'توصيل لموقعك في ولايات السودان المتاحة',
    shippingZoneLabel: 'اختر ولاية أو منطقة التوصيل',
    deliveryAddressLabel: 'العنوان بالتفصيل',
    deliveryAddressPlaceholder: 'المدينة، الحي، رقم المنزل أو معلم بارز',
    phoneLabel: 'رقم هاتف للتواصل (بما في ذلك واتساب)',
    phonePlaceholder: '0912345678 أو 0123456789',
    customerNotesLabel: 'ملاحظات إضافية على الطلب (اختياري)',
    customerNotesPlaceholder: 'أي توجيهات خاصة بالاستلام أو التوصيل...',
    summaryItems: 'الأجهزة المطلوبة',
    deliveryFee: 'رسوم التوصيل:',
    grandTotal: 'الإجمالي النهائي المطلوب:',
    submitOrderButton: 'تثبيت السعر وتأكيد الطلب',
    submitting: 'جاري تسجيل الطلب وتثبيت السعر...',
    validationPhoneRequired: 'يرجى إدخال رقم هاتف صحيح مكوّن من 10 أرقام.',
    validationAddressRequired: 'يرجى كتابة عنوان التوصيل بالتفصيل.',
    validationZoneRequired: 'يرجى اختيار منطقة التوصيل.',
  },

  orderDetail: {
    orderNumber: 'طلب رقم #{number}',
    priceLockedNotice: 'السعر مثبت لإتمام التحويل',
    priceLockedAmount: 'السعر مثبت: {total} ج.س',
    priceExpiresAt: 'ينتهي التثبيت الساعة {time}',
    countdownRemaining: 'الوقت المتبقي للتحويل ورفع الإشعار:',
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    urgentWarning: 'متبقي أقل من 30 دقيقة على انتهاء مهلة تثبيت السعر.',
    expiredTitle: 'انتهت مهلة تثبيت السعر',
    expiredDesc: 'انتهت مهلة تثبيت السعر لهذا الطلب وتم إلغاء الحجز تلقائيًا. يمكنك إعادة الطلب بالأسعار المحدثة حاليًا.',
    reorderButton: 'إعادة الطلب بالأسعار الحالية',
    reordering: 'جاري تجهيز إعادة الطلب...',
    bankCardTitle: 'بيانات التحويل عبر تطبيق بنكك',
    bankName: 'بنك الخرطوم (Bank of Khartoum)',
    accountNumber: 'رقم الحساب:',
    accountName: 'اسم الحساب:',
    transferNote: 'ملاحظة التحويل:',
    transferNoteHint: 'اكتب رقم طلبك #{number} في حقل الملاحظات بتطبيق بنكك.',
    copyAccount: 'نسخ رقم الحساب',
    uploadProofTitle: 'رفع صورة إشعار التحويل البنكي',
    uploadProofDesc: 'بعد إتمام التحويل عبر تطبيق بنكك، ارفع صورة الإشعار هنا لمراجعتها وتجهيز طلبك.',
    chooseReceiptFile: 'اضغط لاختيار صورة إشعار التحويل',
    receiptFormatHint: 'صورة واضحة أو لقطة شاشة من تطبيق بنكك (JPEG أو PNG)',
    senderNameLabel: 'اسم صاحب الحساب المحوِّل (اختياري)',
    senderNamePlaceholder: 'الاسم كما يظهر في إشعار بنكك',
    referenceNumberLabel: 'الرقم المرجعي للإشعار (اختياري)',
    referenceNumberPlaceholder: 'رقم العملية المرجعي من بنكك',
    confirmAndUpload: 'تأكيد وإرسال الإشعار',
    uploadingProof: 'جاري ضغط ورفع الإشعار...',
    proofReceivedTitle: 'تم استلام إشعار التحويل بنجاح',
    proofReceivedDesc: 'يقوم فريق المتجر حاليًا بمطابقة الإشعار وتأكيد حجز جهازك.',
    timelineTitle: 'مراحل متابعة الطلب',
    orderItemsTitle: 'تفاصيل المنتجات والحساب',
    contactSupportForOrder: 'تواصل عبر واتساب لمتابعة هذا الطلب',
  },

  orderStatuses: {
    pending_payment: 'بانتظار التحويل',
    payment_review: 'قيد مراجعة الإشعار',
    confirmed: 'تم التأكيد',
    ready_for_pickup: 'جاهز للاستلام',
    out_for_delivery: 'في الطريق إليك',
    completed: 'مكتمل ومستلم',
    cancelled: 'ملغي',
    expired: 'انتهت المهلة',
  },

  proofStatuses: {
    pending: 'قيد التدقيق',
    approved: 'معتمد ومطابق',
    rejected: 'مرفوض',
  },

  ordersList: {
    title: 'طلباتي',
    subtitle: 'سجل ومتابعة طلباتك السابقة والحالية',
    tabAll: 'الكل',
    tabPending: 'بانتظار التحويل',
    tabConfirmed: 'المؤكدة',
    tabCompleted: 'المكتملة',
    noOrdersTitle: 'لا توجد طلبات في هذا القسم',
    noOrdersDesc: 'عندما تقدم طلبًا جديدًا، ستتمكن من متابعته هنا.',
    viewDetails: 'عرض تفاصيل الطلب',
    date: 'تاريخ الطلب: {date}',
    total: 'الإجمالي: {total} ج.س',
  },

  notifications: {
    title: 'مركز التنبيهات',
    subtitle: 'متابعة تحديثات طلباتك وعمليات الدفع',
    markAllRead: 'تحديد الكل كمقروء',
    noNotificationsTitle: 'لا توجد تنبيهات جديدة',
    noNotificationsDesc: 'ستصلك هنا إشعارات فورية بكل جديد يخص طلباتك.',
    typeOrders: 'الطلبات',
    typePayment: 'سداد بنكك',
    typePriceUpdate: 'تحديث الأسعار',
    typeGeneral: 'تنبيه',
  },

  announcements: {
    title: 'تنبيهات المتجر',
    bannerTitle: 'تنبيه هام',
    dismiss: 'إغلاق',
    readMore: 'عرض التفاصيل',
  },

  recentPurchases: {
    toastText: 'تم شراء {product} قبل {time}',
    justNow: 'لحظات',
    minute: 'دقيقة',
    twoMinutes: 'دقيقتين',
    minutes: '{count} دقائق',
    minuteSuffix: '{count} دقيقة',
    hour: 'ساعة',
    twoHours: 'ساعتين',
    hours: '{count} ساعات',
    hourSuffix: '{count} ساعة',
    day: 'يوم',
    twoDays: 'يومين',
    days: '{count} أيام',
    daySuffix: '{count} يومًا',
  },

  ordersDisabled: {
    bannerTitle: 'استقبال الطلبات متوقف مؤقتًا',
    defaultMessage: 'استقبال الطلبات متوقف مؤقتًا في الوقت الحالي، نعتذر عن الإزعاج.',
    actionDisabled: 'استقبال الطلبات متوقف حاليًا',
    actionDisabledShort: 'الطلب متوقف',
  },

  paymentAccounts: {
    title: 'حسابات التحويل المعتمدة',
    subtitle: 'يرجى تحويل المبلغ المطلوب إلى أحد الحسابات البنكية المعتمدة التالية:',
    generalNotesTitle: 'تعليمات السداد والتحويل',
    bankName: 'البنك',
    accountNumber: 'رقم الحساب',
    accountName: 'اسم الحساب',
    branch: 'الفرع',
    notes: 'ملاحظات',
    copyAccountNumber: 'نسخ رقم الحساب',
    copyOrderNumber: 'نسخ رقم الطلب',
    copiedAccountSuccess: 'تم نسخ رقم الحساب',
    copiedOrderSuccess: 'تم نسخ رقم الطلب',
    orderCreationBlocked: 'عذرًا، استقبال الطلبات متوقف مؤقتًا في الوقت الحالي.',
  },

  account: {
    title: 'حسابي',
    subtitle: 'بيانات الحساب وتفضيلات المتجر',
    userFallback: 'عميل ويكس',
    phoneNotSet: 'لم يُسجل رقم هاتف بعد',
    guestNotice: 'أنت تتصفح كزائر. سجّل دخولك لتتمكن من متابعة طلباتك السابقة.',
    loginAction: 'تسجيل الدخول / إنشاء حساب',
    menuOrders: 'متابعة طلباتي',
    menuNotifications: 'مركز التنبيهات',
    menuPriceLockGuide: 'كيف يعمل نظام تثبيت السعر؟',
    menuMotionMode: 'تفضيلات الحركة والرسوم',
    motionFull: 'كاملة (افتراضي)',
    motionLite: 'مخففة (أداء اقتصادي)',
    motionReduced: 'موقوفة (إمكانية وصول)',
    menuSupport: 'تواصل مع الدعم الفني عبر واتساب',
    menuAdmin: 'لوحة إدارة المتجر',
    logout: 'تسجيل الخروج',
    priceLockModalTitle: 'نظام تثبيت السعر في ويكس',
    priceLockModalBody: 'تتغيّر أسعار الأجهزة التقنية وفقًا لتقلّبات السوق. عند تقديم الطلب عبر التطبيق، يثبّت نظام ويكس السعر لك لمدة 4 ساعات كاملة لتتمكّن من التحويل وتأكيد الحجز دون أي تأثر بتغيّر الأسعار اللاحق.',
    understood: 'فهمت ذلك',
  },

  auth: {
    loginTitle: 'تسجيل الدخول إلى ويكس',
    loginSubtitle: 'أدخل بريدك الإلكتروني ليصلك رمز التحقق دون كلمة مرور',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'name@example.com',
    sendOtp: 'إرسال رمز التحقق',
    sendingOtp: 'جاري إرسال الرمز...',
    verifyTitle: 'أدخل رمز التحقق',
    verifySubtitle: 'أرسلنا رمزًا مكونًا من 6 أرقام إلى {email}',
    nameLabel: 'الاسم الكامل',
    namePlaceholder: 'محمد أحمد',
    codeLabel: 'رمز التحقق',
    verifyAction: 'تأكيد الرمز والمتابعة',
    verifying: 'جاري التحقق...',
    resendCode: 'إعادة إرسال الرمز',
    resendCountdown: 'يمكنك طلب رمز جديد بعد {seconds} ثانية',
    googleSignIn: 'المتابعة باستخدام Google',
    invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    invalidCode: 'رمز التحقق يجب أن يتكوّن من 6 أرقام.',
  },

  motion: {
    label: 'وضع الحركة',
    fullDesc: 'تأثيرات حركية غنية وانتقالات تفاعلية كاملة.',
    liteDesc: 'أداء سلس واقتصادي للأجهزة المحدودة الموارد.',
    reducedDesc: 'حركة ثابتة ومريحة للمستخدمين الحساسين للحركة.',
  },
};

/**
 * Helper to look up a string using dot-notation path, with parameter interpolation.
 * Example: t('priceNotice.full', { hours: 4 })
 */
export function t(key, vars = {}) {
  const parts = key.split('.');
  let current = ar;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key; // Fallback to key if not found
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  let result = current;
  for (const [varKey, varValue] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${varKey}\\}`, 'gi');
    result = result.replace(regex, String(varValue));
  }
  return result;
}

/**
 * Maps common backend API response messages to Modern Standard Arabic (Fusha).
 */
export function mapApiMessage(rawMsg) {
  if (!rawMsg || typeof rawMsg !== 'string') {
    return ar.common.errorGeneric;
  }

  const normalized = rawMsg.trim();

  // Known backend string mappings
  const mapping = {
    'تم تحديث البيانات بنجاح': 'تم تحديث البيانات بنجاح.',
    'تم تسجيل الدخول بنجاح': 'تم تسجيل الدخول بنجاح.',
    'تم إرسال رمز التحقق': 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.',
    'تم إنشاء الطلب بنجاح': 'تم تسجيل الطلب وتثبيت السعر بنجاح.',
    'تم رفع إشعار التحويل بنجاح': 'تم استلام إشعار التحويل بنجاح وسنقوم بمراجعته فورًا.',
    'تم إلغاء الطلب بنجاح': 'تم إلغاء الطلب بنجاح.',
    'رمز التحقق غير صحيح أو منتهي': 'رمز التحقق غير صحيح أو انتهت صلاحيته.',
    'المستخدم غير موجود': 'الحساب غير موجود.',
    'غير مصرح': 'يرجى تسجيل الدخول للمتابعة.',
    'نفدت الكمية': 'عذرًا، نفدت الكمية المتوفرة من هذا الجهاز.',
    'طلب غير صالح': 'بيانات الطلب غير مكتملة، يُرجى المراجعة والمحاولة مجددًا.',
  };

  if (mapping[normalized]) {
    return mapping[normalized];
  }

  // Remove exclamation marks and colloquialisms if any leak through
  return normalized
    .replace(/[!！]/g, '.')
    .replace(/بنثبت ليك/g, 'نثبّت لك')
    .replace(/بيتحول/g, 'يتم تحويله')
    .replace(/مافي/g, 'لا يوجد')
    .replace(/عشان/g, 'لتتمكّن من');
}
