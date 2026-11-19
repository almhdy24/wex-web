# دليل النشر والتهيئة (Deployment Guide)

دليل شامل لنشر وتشغيل واجهة **ويكس تكنولوجي (Wex Technology)** على خوادم الويب في بيئات الإنتاج (Apache / Nginx) وبيئة التطوير المحلية على Termux.

---

## 1. بناء حزمة الإنتاج (Production Build)

داخل مجلد المشروع `~/projects/wex-web`:

```bash
# تثبيت التبعيات إذا لزم
npm install

# تشغيل الاختبارات الآلية للتأكد من سلامة النظام
npm run test

# بناء الحزمة للإنتاج
npm run build
```

يتم إنشاء جميع الملفات الجاهزة للنشر داخل المجلد:
`~/projects/wex-web/dist/`

---

## 2. النشر على خادم Apache (مع ملف `.htaccess`)

عند النشر على خادم استضافة مشتركة (cPanel / DirectAdmin) أو سيرفر Apache، يجب وضع ملف `.htaccess` داخل مجلد الجذر للواجهة الأمامية `dist/`.

### محتوى ملف `.htaccess` الموصى به:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. إجبار التحويل إلى بروتوكول HTTPS المشفر
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. السماح بالوصول المباشر للملفات والمجلدات الحقيقية
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. توجيه كافة مسارات SPA إلى index.html
  RewriteRule ^ index.html [L]
</IfModule>

# 4. أنواع MIME الصحيحة لملفات PWA والخطوط
<IfModule mod_mime.c>
  AddType application/manifest+json .webmanifest
  AddType application/javascript .js .mjs
  AddType image/svg+xml .svg
  AddType font/woff2 .woff2
</IfModule>

# 5. ضغط الملفات لتوفير استهلاك البيانات وتسريع التحميل (Gzip/Deflate)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json application/manifest+json
  AddOutputFilterByType DEFLATE image/svg+xml font/woff2
</IfModule>

# 6. ترويسات الأمان الصارمة (Security Headers)
<IfModule mod_headers.c>
  # منع كشف نوع الملف في المتصفح
  Header always set X-Content-Type-Options "nosniff"

  # منع التضمين داخل إطارات خارجية لحماية الموقع من هجمات Clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"

  # تفعيل حماية المتصفح من هجمات XSS
  Header always set X-XSS-Protection "1; mode=block"

  # سياسة الإحالة
  Header always set Referrer-Policy "strict-origin-when-cross-origin"

  # تقييد صلاحيات المتصفح للأجهزة (كاميرا، مايكروفون، موقع جغرافي)
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

  # منع تخزين صفحة index.html وملف service worker لضمان وصول التحديثات فوراً
  <FilesMatch "(index\.html|registerSW\.js|sw\.js)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>

  # تخزين طويل الأمد للأصول الرقمية المحمية ببصمة تجزئة (Hashed Assets)
  <FilesMatch "\.(js|css|woff2|png|jpg|jpeg|svg|webp|ico)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>
</IfModule>
```

---

## 3. النشر على خادم Nginx

في حال استخدام Nginx كخادم ويب أساسي أو عكسي:

```nginx
server {
    listen 80;
    server_name wextechnology.com www.wextechnology.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wextechnology.com www.wextechnology.com;

    root /var/www/wex-web/dist;
    index index.html;

    # شهادات الأمان SSL
    ssl_certificate /etc/letsencrypt/live/wextechnology.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wextechnology.com/privkey.pem;

    # ترويسات الأمان
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # توجيه مسارات SPA إلى index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # عدم تخزين index.html و service worker
    location ~* (index\.html|registerSW\.js|sw\.js)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # تخزين الأصول الثابتة ذات البصمة
    location ~* \.(js|css|png|jpg|jpeg|svg|webp|woff2|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # وكيل عكسي لواجهة API الخلفية
    location /api/ {
        proxy_pass http://127.0.0.1:8081/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. متغيرات البيئة للإنتاج (.env)

عند بناء الحزمة للإنتاج، قم بإنشاء ملف `.env.production` مع القيم الحقيقية:

```env
VITE_API_BASE_URL=https://api.wextechnology.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_APP_NAME="Wex Technology | ويكس تكنولوجي"
```

---

## 5. التشغيل والمعاينة المحلية في بيئة Termux

لمعاينة نسخة الإنتاج محلياً داخل جهاز أندرويد عبر Termux:

```bash
cd ~/projects/wex-web
npm run build
npx vite preview --host 0.0.0.0 --port 5000
```

يمكن الوصول للتطبيق من المتصفح عبر:
`http://localhost:5000` أو عنوان IP المحلي للجهاز على شبكة الواي فاي.
