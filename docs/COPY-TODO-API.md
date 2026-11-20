# Backend API Copy Modernization Recommendations (`COPY-TODO-API.md`)

This document records the user-facing Arabic strings currently originating in `~/projects/wex-api` (CodeIgniter 4 controllers, services, and language files) that use Sudanese colloquial forms or informal phrasing.

The frontend (`~/projects/wex-web`) has already implemented an active mapping and normalization layer (`src/content/ar.js:mapApiMessage`) to present clean Modern Standard Arabic (الفصحى المعاصرة الميسرة) without touching `wex-api`.

When `wex-api` is next maintained, update the backend source files as listed below.

---

## 1. Strings in `app/Language/ar/Api.php` or Controllers

| Current Backend String (Colloquial / Informal) | Recommended Modern Standard Arabic (Fusha) | Location in `wex-api` |
| :--- | :--- | :--- |
| `بنثبت ليك السعر لمدة 4 ساعات` | `نثبّت لك السعر لمدة 4 ساعات` | `SettingService.php`, `EmailService.php` |
| `وسعر الصرف المعتمد للطلب` | *Removed from customer responses in Decision 12* | Email templates |
| `تم رفع إشعار التحويل بنجاح، جاري المراجعة` | `تم استلام إشعار التحويل بنجاح وسنقوم بمراجعته فورًا.` | `PaymentProofController.php` |
| `رمز التحقق غير صحيح أو انتهت مدته` | `رمز التحقق غير صحيح أو انتهت صلاحيته.` | `AuthService.php` |
| `مافي كمية كافية بالمخزون` | `الكمية المطلوبة غير متوفرة في المخزون حاليًا.` | `OrderService.php` |
| `انتهت مهلة تثبيت السعر، سعر اللابتوب بيتغير مع الصرف` | `انتهت مهلة تثبيت السعر لهذا الطلب وتم إلغاء الحجز.` | `app/Views/emails/order_expired.php` |
| `الطلب قيد المراجعة حالياً ومطابقة العملية` | `الطلب قيد التدقيق ومطابقة إشعار التحويل.` | `OrderService.php` |

---

## 2. General Style Guidelines for `wex-api` Updates

1. **No Colloquial Particles**: Avoid Sudanese dialect particles like `بنثبت`, `ليك`, `عشان`, `مافي`, `بيتحول`. Use `نثبّت`, `لك`, `لتتمكّن من`, `لا يوجد`, `يتم تحويله`.
2. **Punctuation**: Never use exclamation marks (`!`). Use standard periods (`.`).
3. **No Reference Currency in Customer Messages**: Strictly avoid mentioning `درهم`, `AED`, `دولار`, or numerical exchange rates in any customer-facing notifications or logs.
