# Wex Push Notifications — Flutter Android/iOS Contract & Integration Guide

This document defines the exact API contract, payload schema, Android notification channels, Firebase setup, and Dart integration code so the future Flutter app plugs directly into `wex-api` without any backend redesign.

---

## 1. Backend Endpoints (Authenticated, Bearer JWT)

Base URL: `https://api.wex.sd/api/v1` (or your production API origin).

### 1.1 Register / Refresh FCM Token
`POST /api/v1/push/subscriptions`

```json
{
  "platform": "android",
  "provider": "fcm",
  "token": "<FCM_REGISTRATION_TOKEN>",
  "device_label": "Samsung Galaxy A54",
  "locale": "ar",
  "app_version": "1.0.0",
  "topics": ["customers"]
}
```
- Upserts by `sha256(token)` (`endpoint_hash`).
- Automatically re-binds the token to the currently authenticated `user_id` if another user logs in on the same device.
- Call on app startup (when logged in) and inside `FirebaseMessaging.instance.onTokenRefresh`.

### 1.2 Delete Token on Logout
`DELETE /api/v1/push/subscriptions`

```json
{
  "endpoint_or_token": "<FCM_REGISTRATION_TOKEN>"
}
```
Call **before** `POST /api/v1/auth/logout` while the Bearer JWT is still valid.

### 1.3 Preferences
- `GET /api/v1/push/preferences`
- `PUT /api/v1/push/preferences`
```json
{
  "order_updates": true,
  "payment_updates": true,
  "price_alerts": true,
  "announcements": true
}
```

### 1.4 In-App Notification Sync
- `GET /api/v1/notifications?page=1&per_page=20`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/{id}/read`

---

## 2. Payload Schema & Arabic Strings

All Arabic notification copy lives in **one place** on the backend:
`wex-api/app/Config/PushTemplates.php`.

Every FCM HTTP v1 message sent by `FcmProvider` contains:
```json
{
  "notification": {
    "title": "تم تأكيد الدفع بنجاح",
    "body": "تم تأكيد الدفع لطلبك رقم WEX-20261125-0001 وجاري التجهيز."
  },
  "data": {
    "type": "payment_approved",
    "orderId": "42",
    "orderNumber": "WEX-20261125-0001",
    "url": "/orders/WEX-20261125-0001",
    "notificationId": "108"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "payments",
      "tag": "order-WEX-20261125-0001"
    }
  }
}
```
> **Privacy Rule**: Push payloads never contain bank account numbers, phone numbers, receipt images, AED/exchange rates, or admin names.

---

## 3. Android Notification Channels & Deep Link Mapping

| Channel ID | Arabic Name | Mapped Preference Categories | Importance |
|---|---|---|---|
| `orders` | تحديثات الطلبات | `order_updates`, `new_orders`, `low_stock` | High |
| `payments` | المدفوعات والتحويلات | `payment_updates`, `receipts` | High |
| `offers` | العروض والإعلانات | `announcements`, `price_alerts` | Default |

### Deep Link Route Mapping
| `data.url` | Flutter Route |
|---|---|
| `/orders/:orderNumber` | `OrderDetailScreen(orderNumber: ...)` |
| `/admin/orders/:orderNumber` | `AdminOrderDetailScreen(orderNumber: ...)` |
| `/notifications` | `NotificationsScreen()` |
| `/products` | `CatalogScreen()` |

---

## 4. Firebase Project & Backend Setup

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Add an Android app with your application ID (e.g. `sd.wex.app`), download `google-services.json`, and place it in `android/app/google-services.json`.
3. In Firebase Console -> **Project Settings -> Service Accounts**, click **Generate new private key** to download the JSON credentials file.
4. Upload that JSON file to a non-public path on the `wex-api` server (e.g. `/home/user/secrets/firebase-sa.json`).
5. Update `wex-api/.env`:
   ```env
   FCM_ENABLED=true
   FCM_PROJECT_ID=your-firebase-project-id
   FCM_SERVICE_ACCOUNT_PATH=/home/user/secrets/firebase-sa.json
   ```
6. Verify from the server CLI:
   ```bash
   php spark push:fcm-test <DEVICE_FCM_TOKEN>
   ```

---

## 5. Ready-to-Paste Dart Snippets

```dart
import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final FlutterLocalNotificationsPlugin localNotifications =
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel ordersChannel = AndroidNotificationChannel(
  'orders',
  'تحديثات الطلبات',
  description: 'إشعارات حالة الطلب وتجهيزه وتوصيله',
  importance: Importance.high,
);

const AndroidNotificationChannel paymentsChannel = AndroidNotificationChannel(
  'payments',
  'المدفوعات والتحويلات',
  description: 'إشعارات استلام وتأكيد التحويل البنكي',
  importance: Importance.high,
);

const AndroidNotificationChannel offersChannel = AndroidNotificationChannel(
  'offers',
  'العروض والإعلانات',
  description: 'تنبيهات الأسعار وإعلانات المتجر',
  importance: Importance.defaultImportance,
);

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

Future<void> initWexPush({
  required Future<void> Function(String token) registerTokenWithApi,
  required void Function(String url, String? notificationId) onDeepLink,
}) async {
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // Android 13+ runtime permission
  final messaging = FirebaseMessaging.instance;
  final settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  // Create Android channels
  final androidPlugin = localNotifications
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
  await androidPlugin?.createNotificationChannel(ordersChannel);
  await androidPlugin?.createNotificationChannel(paymentsChannel);
  await androidPlugin?.createNotificationChannel(offersChannel);

  const initSettings = InitializationSettings(
    android: AndroidInitializationSettings('@mipmap/ic_launcher'),
  );
  await localNotifications.initialize(
    initSettings,
    onDidReceiveNotificationResponse: (details) {
      if (details.payload != null) {
        final data = jsonDecode(details.payload!) as Map<String, dynamic>;
        onDeepLink(data['url'] ?? '/notifications', data['notificationId']?.toString());
      }
    },
  );

  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    final token = await messaging.getToken();
    if (token != null) {
      await registerTokenWithApi(token);
    }
  }

  messaging.onTokenRefresh.listen((newToken) async {
    await registerTokenWithApi(newToken);
  });

  // Foreground message -> display local notification
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    final notif = message.notification;
    if (notif == null) return;
    final type = message.data['type'] ?? '';
    final channel = type.contains('payment')
        ? paymentsChannel
        : type.contains('order')
            ? ordersChannel
            : offersChannel;

    localNotifications.show(
      message.hashCode,
      notif.title,
      notif.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channel.id,
          channel.name,
          channelDescription: channel.description,
          importance: channel.importance,
          priority: Priority.high,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  });

  // App opened from background notification tap
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    onDeepLink(
      message.data['url'] ?? '/notifications',
      message.data['notificationId']?.toString(),
    );
  });

  // App launched from terminated state via notification tap
  final initial = await messaging.getInitialMessage();
  if (initial != null) {
    onDeepLink(
      initial.data['url'] ?? '/notifications',
      initial.data['notificationId']?.toString(),
    );
  }
}
```
