/**
 * Central Modern Standard Arabic (الفصحى المعاصرة) Dictionary
 * All customer-visible storefront copy resides strictly in this file.
 *
 * Rules:
 * - Western digits only (0-9).
 * - Exact Copy Deck compliance.
 * - Zero marketing puffery, zero emojis, zero dialect words.
 * - Always "ج.س" for currency (never "جنيه").
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
    backToHome: 'العودة للرئيسية',
    close: 'إغلاق',
    copy: 'نسخ',
    copied: 'تم النسخ',
    share: 'مشاركة',
    compare: 'مقارنة',
    all: 'الكل',
    viewAll: 'عرض الكل',
    search: 'بحث',
    filter: 'تصفية',
    clearFilter: 'مسح التصفية',
    sort: 'ترتيب',
    apply: 'تطبيق',
    clear: 'مسح',
    sdg: 'ج.س',
    currencyUnit: 'ج.س',
    free: 'مجانًا',
    quantity: 'الكمية',
    itemsCount: '{count} أجهزة',
    singleItem: 'جهاز واحد',
    twoItems: 'جهازان',
    threeToTenItems: '{count} أجهزة',
    moreItems: '{count} جهازًا',
    offlineTitle: 'لا يوجد اتصال بالشبكة',
    offlineDesc: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundDesc: 'لم يتم العثور على الصفحة المطلوبة.',
    errorGeneric: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    connectionError: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
  },

  navigation: {
    home: 'الرئيسية',
    catalog: 'المتجر',
    accessories: 'الملحقات',
    orders: 'طلباتي',
    account: 'حسابي',
    cart: 'السلة',
    favorites: 'المفضلة',
    wishlist: 'المفضلة',
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
    searchPlaceholder: 'ابحث عن جهاز أو ماركة',
    notificationsTitle: 'التنبيهات',
    noNotifications: 'لا توجد تنبيهات جديدة',
    viewAllNotifications: 'عرض جميع التنبيهات',
    cartDrawerTitle: 'السلة',
    cartEmpty: 'السلة فارغة حاليًا',
    cartSubtotal: 'المجموع',
    appDiscount: 'خصم التطبيق (3%)',
    cartTotal: 'الإجمالي',
    proceedCheckout: 'متابعة',
    viewFullCart: 'عرض السلة',
    continueShopping: 'إضافة منتجات أخرى',
    accountMenu: 'قائمة الحساب',
    guestUser: 'زائر',
    loginNow: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    myOrders: 'طلباتي',
    wishlist: 'المفضلة',
    profile: 'بيانات الحساب',
    settings: 'إعدادات العرض',
    footer: {
      aboutShop: 'مقرنا في مول الواحة بأم درمان نوفر الحواسيب والملحقات بأسعار واضحة.',
      quickLinks: 'روابط المتجر',
      contactUs: 'تواصل معنا',
      howToOrder: 'طريقة الطلب',
      faq: 'الأسئلة الشائعة',
      privacyPolicy: 'سياسة الاستلام',
      step1: '1. اختر الجهاز',
      step2: '2. أكّد الطلب وثبّت السعر',
      step3: '3. حوّل المبلغ وارفع الإشعار',
      step4: '4. استلم من المحل أو بالتوصيل',
      copyright: 'جميع الحقوق محفوظة © {year} ويكس تكنولوجي.',
    },
  },

  splash: {
    title: 'ويكس تكنولوجي',
    brandEn: 'WEX TECHNOLOGY',
    subtitle: 'أجهزة الحواسيب المحمولة والإلكترونيات',
    subtitleEn: 'Laptops & Technology Solutions',
    location: 'أم درمان · مول الواحة',
    locationEn: 'Omdurman · Al Waha Mall',
    initializing: 'جاري تهيئة المتجر...',
    skip: 'تخطي',
    ariaLabel: 'شاشة تحميل متجر ويكس تكنولوجي',
  },

  priceNotice: {
    full: 'بعد تأكيد الطلب يبقى السعر ثابتًا لمدة {hours} ساعات لتتمكّن من التحويل.',
    short: 'بعد تأكيد الطلب يبقى السعر ثابتًا لمدة {hours} ساعات لتتمكّن من التحويل.',
    pricesUpdatedAt: 'آخر تحديث للأسعار: {time}',
    pricesUpdatedToday: 'اليوم',
  },

  home: {
    greetingGuest: 'مرحبًا بك',
    greetingUser: 'مرحبًا، {name}',
    searchPlaceholder: 'ابحث عن جهاز أو ماركة',
    recentSearches: 'عمليات البحث الأخيرة',
    popularSearches: 'الأكثر بحثًا',
    lastPriceUpdate: 'آخر تحديث للأسعار: {time}',
    quickActions: {
      browse: 'تصفّح الأجهزة',
      track: 'طلباتي',
      whatsapp: 'تواصل عبر واتساب',
      location: 'الموقع على الخريطة',
    },
    hero: {
      slide1Title: 'أجهزة لابتوب جديدة ومستعملة',
      slide1Subtitle: 'تصفّح الأجهزة المتوفرة بأسعار واضحة.',
      slide1Cta: 'تصفّح الأجهزة',
      slide2Title: 'ثبّت السعر عند الطلب',
      slide2Subtitle: 'بعد تأكيد الطلب يبقى السعر ثابتًا لمدة {hours} ساعات لتتمكّن من التحويل.',
      slide2Cta: 'طريقة الطلب',
      slide3Title: 'ملحقات الحاسوب',
      slide3Subtitle: 'اختر ما يلزم جهازك من الملحقات.',
      slide3Cta: 'تصفّح الملحقات',
    },
    categories: {
      laptops: 'الحواسيب',
      phones: 'الهواتف',
      accessories: 'الملحقات',
      conditionNew: 'جديد',
      conditionUsed: 'مستعمل استيراد',
    },
    rails: {
      newArrivals: 'وصل حديثًا',
      study: 'للدراسة',
      work: 'للعمل',
      accessories: 'ملحقات',
      viewAll: 'عرض الكل',
    },
    howToOrder: {
      title: 'طريقة الطلب',
      subtitle: '',
      step1Title: 'اختر الجهاز',
      step1Desc: 'تصفّح الأجهزة المتوفرة واختر ما يناسبك.',
      step2Title: 'أكّد الطلب وثبّت السعر',
      step2Desc: 'يبقى السعر ثابتًا لتتمكّن من التحويل.',
      step3Title: 'حوّل المبلغ وارفع الإشعار',
      step3Desc: 'حوّل عبر الحسابات المتاحة وارفع صورة الإشعار.',
      step4Title: 'استلم من المحل أو بالتوصيل',
      step4Desc: 'استلم من المتجر أو عبر التوصيل لمنطقتك.',
    },
    shopInfo: {
      title: 'ويكس تكنولوجي',
      address: 'مول الواحة، الشهداء، أم درمان',
      hours: 'السبت - الخميس: 9:00 ص - 9:00 م',
      openHoursNote: 'الجمعة: مغلق',
      hoursWeekday: 'السبت - الخميس: 9:00 ص - 9:00 م',
      hoursFriday: 'الجمعة: مغلق',
      openMap: 'الموقع على الخريطة',
      whatsappChat: 'تواصل عبر واتساب',
    },
    floatingWhatsapp: 'تواصل عبر واتساب',
  },

  product: {
    conditionNew: 'جديد',
    conditionUsed: 'مستعمل استيراد',
    conditionRefurbished: 'مجدد',
    conditionOpenBox: 'كرتونة مفتوحة',
    stockAvailable: 'متوفر',
    stockLow: 'كمية محدودة',
    outOfStock: 'غير متوفر حاليًا',
    outOfStockBadge: 'غير متوفر',
    lowStockBadge: 'كمية محدودة',
    onlyLeft: 'متبقي {count} فقط',
    quickAdd: 'أضف',
    addToCart: 'أضف إلى السلة',
    addedToCart: 'أُضيف إلى السلة',
    inCart: 'في السلة',
    specifications: 'المواصفات',
    deliveryTab: 'الاستلام والتوصيل',
    specLabels: {
      processor: 'المعالج',
      ram: 'الذاكرة العشوائية',
      storage: 'التخزين',
      gpu: 'كرت الشاشة',
      screen: 'الشاشة',
      battery: 'البطارية',
    },
    priceNoticeText: 'السعر قابل للتغيير حتى تأكيد الطلب.',
    orderNow: 'اطلب الآن',
  },

  catalog: {
    title: 'الأجهزة',
    searchPlaceholder: 'ابحث عن جهاز أو ماركة',
    filterButton: 'تصفية',
    filterBrand: 'الماركة',
    filterCondition: 'الحالة',
    filterConditionAll: 'الكل',
    filterConditionNew: 'جديد',
    filterConditionUsed: 'مستعمل استيراد',
    filterPrice: 'السعر',
    filterSort: 'الترتيب',
    sortTitle: 'الترتيب',
    sortNewest: 'الأحدث',
    sortPriceAsc: 'السعر: من الأقل',
    sortPriceDesc: 'السعر: من الأعلى',
    applyAction: 'تطبيق',
    clearAction: 'مسح',
    clearFilters: 'مسح التصفية',
    resetFilters: 'مسح التصفية',
    emptyMessage: 'لا توجد أجهزة مطابقة. جرّب تغيير التصفية.',
    noResultsTitle: 'لا توجد أجهزة مطابقة',
    noResultsDesc: 'جرّب تغيير التصفية.',
    resultsCount: '{count} نتيجة',
    resultsZero: 'لا توجد نتائج',
    resultsOne: 'نتيجة واحدة',
    resultsTwo: 'نتيجتان',
    resultsFew: '{count} نتائج',
    resultsMany: '{count} نتيجة',
    typeAll: 'الكل',
    typeLaptops: 'لابتوبات',
    typePhones: 'هواتف',
    typeAccessories: 'ملحقات',
  },

  cart: {
    title: 'السلة',
    emptyTitle: 'السلة فارغة',
    emptyDesc: 'لم تضف أي جهاز بعد.',
    startShopping: 'تصفّح الأجهزة',
    continueShoppingLink: 'إضافة منتجات أخرى',
    itemCount: 'المجموع ({count})',
    subtotal: 'المجموع ({count})',
    appDiscount: 'خصم التطبيق (3%)',
    total: 'الإجمالي',
    proceed: 'متابعة',
    removeItem: 'إزالة',
    unitPrice: 'سعر القطعة',
    totalItemPrice: 'المجموع',
    priceChangedNotice: 'تغير السعر',
    confirmPriceChanges: 'موافق على الأسعار المحدثة',
  },

  checkout: {
    title: 'تأكيد الطلب',
    deliveryTypeSection: 'طريقة الاستلام',
    pickupOption: 'الاستلام من المحل',
    pickupFeeNote: 'مجانًا',
    deliveryOption: 'التوصيل',
    deliveryFeeNote: 'حسب المنطقة',
    zoneFieldLabel: 'المنطقة',
    addressFieldLabel: 'العنوان بالتفصيل',
    addressFieldPlaceholder: 'المدينة، الحي، الشارع أو معلم بارز',
    contactSection: 'التواصل',
    phoneFieldLabel: 'رقم الهاتف',
    phoneFieldPlaceholder: '09XXXXXXXX',
    phoneHelperText: 'نتواصل معك على هذا الرقم بشأن طلبك.',
    notesFieldLabel: 'ملاحظات (اختياري)',
    notesFieldPlaceholder: 'أي تفاصيل خاصة بالطلب...',
    summaryTitle: 'ملخص الحساب',
    subtotalRow: 'المجموع',
    discountRow: 'خصم التطبيق (3%)',
    deliveryFeeRow: 'رسوم التوصيل',
    totalRow: 'الإجمالي',
    priceLockLine: 'بعد التأكيد يُثبَّت السعر لمدة {hours} ساعات لتحوّل المبلغ وترفع إشعار التحويل.',
    confirmButton: 'تأكيد الطلب',
    submitting: 'جاري تأكيد الطلب...',
    validationPhoneRequired: 'يرجى إدخال رقم هاتف سوداني صحيح (09 أو 01).',
    validationAddressRequired: 'يرجى إدخال تفاصيل العنوان.',
    validationZoneRequired: 'يرجى اختيار منطقة التوصيل.',
    authSheetTitle: 'سجّل الدخول لإتمام الطلب',
    authSheetDesc: 'لنربط الطلب بحسابك ونرسل لك التحديثات.',
    authGoogleBtn: 'المتابعة باستخدام Google',
    authEmailBtn: 'المتابعة بالبريد الإلكتروني',
  },

  orderDetail: {
    pageHeader: 'الدفع - طلب {number}',
    priceLockedNotice: 'السعر مثبت',
    countdownTitle: 'المتبقي لتثبيت السعر',
    amountRequired: 'المبلغ المطلوب',
    copyAmount: 'نسخ',
    paymentAccountsTitle: 'حساب التحويل',
    bankLabel: 'البنك',
    accountNameLabel: 'اسم الحساب',
    accountNumberLabel: 'رقم الحساب',
    branchLabel: 'الفرع',
    notesLabel: 'ملاحظات',
    copyAction: 'نسخ',
    uploadProofTitle: 'ارفع إشعار التحويل',
    uploadProofDesc: 'صورة واضحة تُظهر المبلغ ورقم العملية.',
    cameraBtn: 'التقاط صورة',
    galleryBtn: 'اختيار من المعرض',
    sendProofBtn: 'إرسال الإشعار',
    proofSentNotice: 'أُرسل الإشعار. بانتظار مراجعة المحل.',
    afterReviewNotice: 'بعد المراجعة نُشعرك بتأكيد الدفع.',
    expiredNotice: 'انتهت مهلة تثبيت السعر.',
    reorderCurrentPriceBtn: 'أعد الطلب بالسعر الحالي',
    rejectedProofNotice: 'الإشعار مرفوض',
    newProofAction: 'ارفع إشعارًا جديدًا',
    timelineTitle: 'متابعة الطلب',
    stickyUploadBtn: 'ارفع إشعار التحويل',
    myOrdersLink: 'طلباتي',
  },

  orderStatuses: {
    pending_payment: 'بانتظار التحويل',
    payment_review: 'قيد المراجعة',
    confirmed: 'تم التأكيد',
    ready_for_pickup: 'جاهز للاستلام',
    out_for_delivery: 'في الطريق',
    completed: 'مكتمل',
    expired: 'منتهي',
    cancelled: 'ملغي',
    rejected: 'الإشعار مرفوض',
  },

  proofStatuses: {
    pending: 'قيد المراجعة',
    approved: 'تم التأكيد',
    rejected: 'الإشعار مرفوض',
  },

  ordersList: {
    title: 'طلباتي',
    subtitle: '',
    tabAll: 'الكل',
    tabPending: 'بانتظار التحويل',
    tabConfirmed: 'المؤكدة',
    tabCompleted: 'المكتملة',
    noOrdersTitle: 'لا توجد طلبات',
    noOrdersDesc: 'عند تقديم طلب جديد يظهر هنا.',
    orderNumberRow: 'طلب #{number}',
    statusRow: 'الحالة: {status}',
    totalRow: 'الإجمالي: {total}',
    timeRow: 'الوقت: {time}',
    payNowBtn: 'رفع إشعار التحويل',
    viewDetails: 'عرض التفاصيل',
  },

  notifications: {
    title: 'التنبيهات',
    subtitle: '',
    markAllRead: 'تحديد الكل كمقروء',
    noNotificationsTitle: 'لا توجد تنبيهات',
    noNotificationsDesc: 'تصلك هنا تحديثات طلباتك.',
    typeOrders: 'الطلبات',
    typePayment: 'التحويل البنكي',
    typePriceUpdate: 'تحديث الأسعار',
    typeGeneral: 'تنبيه',
  },

  announcements: {
    title: 'تنبيهات المتجر',
    bannerTitle: 'تنبيه',
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
    defaultMessage: 'استقبال الطلبات متوقف مؤقتًا، نعتذر عن ذلك.',
    actionDisabled: 'استقبال الطلبات متوقف حاليًا',
    actionDisabledShort: 'الطلب متوقف',
  },

  paymentAccounts: {
    title: 'حساب التحويل',
    subtitle: 'حوّل المبلغ المطلوب إلى أحد حسابات المتجر:',
    generalNotesTitle: 'تعليمات التحويل',
    bankName: 'البنك',
    accountNumber: 'رقم الحساب',
    accountName: 'اسم الحساب',
    branch: 'الفرع',
    notes: 'ملاحظات',
    copyAccountNumber: 'نسخ',
    copyOrderNumber: 'نسخ',
    copiedAccountSuccess: 'تم النسخ',
    copiedOrderSuccess: 'تم النسخ',
    orderCreationBlocked: 'استقبال الطلبات متوقف مؤقتًا.',
  },

  account: {
    title: 'حسابي',
    subtitle: 'بيانات الحساب وتفضيلات المتجر',
    userFallback: 'عميل ويكس',
    phoneNotSet: 'لم يُسجل رقم هاتف بعد',
    guestNotice: 'سجّل دخولك لمتابعة طلباتك وتثبيت الأسعار.',
    loginAction: 'تسجيل الدخول',
    menuOrders: 'طلباتي',
    menuNotifications: 'التنبيهات',
    menuPriceLockGuide: 'تثبيت السعر',
    menuMotionMode: 'تفضيلات الحركة والرسوم',
    motionFull: 'كاملة',
    motionLite: 'مخففة',
    motionReduced: 'موقوفة',
    menuSupport: 'تواصل عبر واتساب',
    menuAdmin: 'لوحة إدارة المتجر',
    logout: 'تسجيل الخروج',
    priceLockModalTitle: 'تثبيت السعر',
    priceLockModalBody: 'بعد تأكيد الطلب يبقى السعر ثابتًا لتتمكّن من التحويل.',
    understood: 'فهمت',
    memberSince: 'عضو منذ {date}',
    tabOverview: 'نظرة عامة',
    tabProfile: 'المعلومات الشخصية',
    tabOrders: 'طلباتي',
    tabWishlist: 'المفضلة',
    tabAddresses: 'عناوين التوصيل',
    tabSecurity: 'الأمان والحسابات المرتبطة',
    tabSettings: 'الإعدادات وتفضيلات المتجر',
    personalInfoTitle: 'تعديل البيانات الشخصية',
    personalInfoDesc: 'تستخدم هذه البيانات في تنسيق التوصيل والاستلام.',
    nameLabel: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف (سوداني)',
    emailLabel: 'البريد الإلكتروني',
    emailVerifiedBadge: 'بريد موثق',
    saveChanges: 'حفظ',
    savingChanges: 'جاري الحفظ...',
    cancel: 'إلغاء',
    savedSuccess: 'تم التحديث بنجاح',
    addressTitle: 'العنوان الافتراضي للتوصيل',
    addressDesc: 'احفظ موقعك لتعبئة بيانات التوصيل تلقائيًا.',
    shippingZoneLabel: 'المنطقة',
    addressLabel: 'تفاصيل العنوان / الشارع',
    addressPlaceholder: 'مثال: أم درمان، الثورة، جوار...',
    saveAddressAction: 'حفظ العنوان',
    addressSavedSuccess: 'تم حفظ العنوان بنجاح',
    securityTitle: 'الحسابات المرتبطة',
    securityDesc: 'طرق تسجيل الدخول.',
    providerEmailOtp: 'البريد الإلكتروني (رمز OTP)',
    providerEmailDesc: 'طريقة الدخول برمز التحقق عبر البريد الإلكتروني.',
    providerGoogle: 'حساب Google',
    providerGoogleConnected: 'مرتبط بحساب Google',
    providerGoogleDisconnected: 'غير مرتبط',
    connectGoogle: 'ربط حساب Google',
    unlinkGoogle: 'إلغاء ربط Google',
    unlinkConfirmTitle: 'إلغاء ربط حساب Google',
    unlinkConfirmBody: 'هل تريد إلغاء ربط حساب Google؟',
    providerFacebook: 'حساب Facebook',
    providerFacebookUnsupported: 'غير مدعوم حاليًا',
    providerFacebookNotice: 'نظام الدخول يعتمد على البريد (OTP) وGoogle.',
    sessionsTitle: 'الجلسات والأجهزة النشطة',
    sessionsDesc: 'إدارة الجلسات النشطة بحسابك.',
    logoutCurrent: 'تسجيل الخروج من هذا الجهاز',
    logoutAll: 'تسجيل الخروج من جميع الأجهزة',
    logoutAllConfirmTitle: 'تسجيل الخروج من جميع الأجهزة',
    logoutAllConfirmBody: 'سيتم إنهاء جميع الجلسات النشطة على أجهزتك.',
    logoutAllSuccess: 'تم تسجيل الخروج بنجاح',
    kpiOrders: 'طلباتي',
    kpiWishlist: 'المفضلة',
    kpiNotifications: 'التنبيهات',
  },

  wishlist: {
    title: 'المفضلة',
    subtitle: 'قائمتك المحفوظة للأجهزة والملحقات',
    itemCount: '{count} أجهزة',
    emptyTitle: 'المفضلة فارغة',
    emptySubtitle: 'احفظ الأجهزة بالضغط على رمز القلب للرجوع إليها لاحقًا.',
    exploreCatalog: 'تصفّح الأجهزة',
    clearAll: 'إفراغ القائمة',
    clearAllConfirmTitle: 'إفراغ القائمة',
    clearAllConfirmBody: 'هل تريد إزالة جميع الأجهزة من المفضلة؟',
    moveAllToCart: 'نقل المتوفر إلى السلة',
    moveToCart: 'نقل إلى السلة',
    addToCart: 'أضف',
    removeFromWishlist: 'إزالة',
    inStock: 'متوفر',
    lowStock: 'كمية محدودة',
    outOfStock: 'غير متوفر حاليًا',
    priceNotice: 'السعر قابل للتغيير حتى تأكيد الطلب.',
    categoryLaptops: 'الحواسيب',
    categoryGaming: 'حواسيب الألعاب',
    categoryAccessories: 'الملحقات',
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
    sessionVerifying: 'جارٍ التحقق من الجلسة',
  },

  motion: {
    label: 'وضع الحركة',
    fullDesc: 'تأثيرات حركية كاملة.',
    liteDesc: 'أداء اقتصادي للأجهزة المحدودة الموارد.',
    reducedDesc: 'حركة ثابتة ومريحة.',
  },

  compare: {
    title: 'مقارنة الأجهزة',
    subtitle: 'مقارنة المواصفات والأسعار جنبًا إلى جنب',
    emptyTitle: 'لا توجد أجهزة في المقارنة',
    emptyDesc: 'يمكنك اختيار حتى 3 أجهزة لمقارنة مواصفاتها وأسعارها جنبًا إلى جنب.',
    browseProducts: 'تصفّح الأجهزة',
    compareNow: 'مقارنة',
    clearAll: 'مسح المقارنة',
    clearShort: 'مسح',
    differencesOnly: 'إظهار الفروق فقط',
    lowestPrice: 'الأقل سعرًا',
    addDevice: 'إضافة جهاز',
    removeDevice: 'إزالة',
    counterText: '{current} من {max}',
    addedToastTitle: 'أُضيف إلى المقارنة',
    removedToastTitle: 'أُزيل من المقارنة',
    maxReachedNotice: 'يمكنك مقارنة 3 أجهزة كحد أقصى.',
    typeMismatchNotice: 'المقارنة متاحة بين أجهزة من النوع نفسه',
    viewCompareAction: 'عرض المقارنة',
    manageCompareAction: 'إدارة المقارنة',
    undoAction: 'تراجع',
    processor: 'المعالج',
    ram: 'الذاكرة العشوائية',
    storage: 'التخزين',
    screen: 'الشاشة',
    screenSize: 'مقاس الشاشة',
    gpu: 'كرت الشاشة',
    condition: 'الحالة',
    battery: 'البطارية',
    warranty: 'الاستلام والتوصيل',
    price: 'السعر',
    addToCart: 'أضف',
  },

  toast: {
    addedToCartTitle: 'أُضيف إلى السلة',
    viewCartAction: 'عرض السلة',
    addedToCompareTitle: 'أُضيف إلى المقارنة',
    removedFromCompareTitle: 'أُزيل من المقارنة',
    viewCompareAction: 'عرض المقارنة',
    undoAction: 'تراجع',
    addedToFavoritesTitle: 'أُضيف إلى المفضلة',
    copiedTitle: 'تم النسخ',
    closeToast: 'إغلاق',
    connectionError: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
  },
};

/**
 * Helper to look up a string using dot-notation path, with parameter interpolation.
 * Example: t('priceNotice.full', { hours: 4 })
 *
 * Runtime safety:
 * - In development and tests, throws an Error on missing keys to enforce 100% dictionary coverage.
 * - In production, returns an empty string (never exposes raw dot-syntax technical keys).
 */
export function t(key, vars = {}) {
  const isProd =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production');

  if (!key || typeof key !== 'string') {
    if (isProd) return '';
    throw new Error(`[i18n] Invalid translation key provided: ${JSON.stringify(key)}`);
  }

  const parts = key.split('.');
  let current = ar;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      if (isProd) return '';
      throw new Error(`[i18n] Missing translation key: "${key}"`);
    }
  }

  if (typeof current !== 'string') {
    if (isProd) return '';
    throw new Error(`[i18n] Translation key is not a string: "${key}"`);
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
    'تم رفع إشعار التحويل بنجاح': 'أُرسل الإشعار. بانتظار مراجعة المحل.',
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

  return normalized
    .replace(/[!！]/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}
