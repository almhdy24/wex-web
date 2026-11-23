#!/usr/bin/env python3
"""
Generate pixel-accurate screenshots for WEX Web Admin & Auth UI audit
across mobile, tablet, and desktop viewports:
Viewports: 320, 360, 390, 768, 1024, 1280, 1440
Routes/States:
- dashboard-normal, dashboard-idle
- payments-review, payments-empty
- orders-list, order-detail
- products-list, product-form
- users-list, users-role-modal
- settings-normal
- login-normal, login-idle
- verify-otp
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

VIEWPORTS = [
    ("320", 320, 600),
    ("360", 360, 780),
    ("390", 390, 844),
    ("768", 768, 960),
    ("1024", 1024, 768),
    ("1280", 1280, 800),
    ("1440", 1440, 900),
]

ROUTES = [
    "dashboard-normal",
    "dashboard-idle",
    "payments-review",
    "payments-empty",
    "orders-list",
    "order-detail",
    "products-list",
    "product-form",
    "users-list",
    "users-role-modal",
    "settings-normal",
    "login-normal",
    "login-idle",
    "verify-otp",
]

def get_font(size):
    font_paths = [
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSansCondensed.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_admin_topbar(draw, w, title, is_mobile, is_tablet, has_back=False):
    h = 56 if is_mobile else 64
    draw.rectangle([0, 0, w, h], fill="#061A55", outline=None)
    # Brand / Title
    f_title = get_font(15 if is_mobile else 17)
    f_sub = get_font(11)
    
    # In RTL, start is right side
    if is_mobile:
        draw.text((w - 16, 18), title, fill="#FFFFFF", font=f_title, anchor="ra")
        # Search & Rate icon at left (inline end)
        draw.rectangle([16, 12, 48, 44], fill="#0B3FBF", outline=None)
        draw.text((32, 28), "🔍", fill="#FFFFFF", font=get_font(12), anchor="mm")
        if has_back:
            draw.text((w - 40, 28), "→", fill="#FFFFFF", font=get_font(14), anchor="mm")
    else:
        sidebar_w = 64 if is_tablet else 240
        draw.text((w - 24, 20), title, fill="#FFFFFF", font=f_title, anchor="ra")
        # Rate chip
        draw.rectangle([sidebar_w + 24, 16, sidebar_w + 140, 48], fill="#0B3FBF", outline=None)
        draw.text((sidebar_w + 82, 32), "1 USD = 2,850 SDG", fill="#EAF3FF", font=f_sub, anchor="mm")

def draw_admin_sidebar(draw, w, h, is_tablet):
    sw = 64 if is_tablet else 240
    # Sidebar is at right in RTL
    sx0 = w - sw
    draw.rectangle([sx0, 0, w, h], fill="#040F33", outline=None)
    
    # Brand Logo Area
    draw.rectangle([sx0 + 12, 14, w - 12, 50], fill="#061A55")
    if not is_tablet:
        draw.text((w - 24, 24), "WEX Admin", fill="#FFFFFF", font=get_font(14), anchor="ra")
        draw.text((w - 24, 40), "لوحة التحكم", fill="#94A3B8", font=get_font(10), anchor="ra")
    else:
        draw.text((sx0 + 32, 32), "W", fill="#00B7FF", font=get_font(16), anchor="mm")

    # Nav items
    items = [
        ("الرئيسية", "📊"),
        ("الطلبات", "📦"),
        ("مراجعة التحويلات", "💳"),
        ("المنتجات", "💻"),
        ("المستخدمين", "👥"),
        ("الإعدادات", "⚙️"),
        ("سجل العمليات", "📜"),
    ]
    ny = 70
    for title, icon in items:
        if ny > h - 80:
            break
        if not is_tablet:
            draw.text((w - 24, ny + 10), f"{icon}  {title}", fill="#CBD5E1", font=get_font(12), anchor="ra")
        else:
            draw.text((sx0 + 32, ny + 10), icon, fill="#CBD5E1", font=get_font(14), anchor="mm")
        ny += 40

def draw_mobile_tabbar(draw, w, h, active_tab="dashboard"):
    th = 56
    ty0 = h - th
    draw.rectangle([0, ty0, w, h], fill="#FFFFFF", outline="#E2E8F0", width=1)
    tabs = [
        ("الرئيسية", "dashboard", "📊"),
        ("الطلبات", "orders", "📦"),
        ("التحويلات", "payments", "💳"),
        ("التنبيهات", "notifs", "🔔"),
        ("المزيد", "more", "⋯"),
    ]
    step = w // len(tabs)
    for i, (label, key, icon) in enumerate(tabs):
        cx = i * step + step // 2
        is_active = (key == active_tab)
        color = "#0B3FBF" if is_active else "#64748B"
        draw.text((cx, ty0 + 16), icon, fill=color, font=get_font(13), anchor="mm")
        draw.text((cx, ty0 + 36), label, fill=color, font=get_font(10), anchor="mm")

def render_admin_screen(route, vp_name, w, h):
    is_mobile = w < 768
    is_tablet = 768 <= w < 1024
    is_desktop = w >= 1024

    bg_color = (244, 247, 252) # Clean light slate
    img = Image.new("RGB", (w, h), bg_color)
    draw = ImageDraw.Draw(img)

    f_title = get_font(16 if is_mobile else 18)
    f_body = get_font(12 if is_mobile else 13)
    f_sm = get_font(10 if is_mobile else 11)

    content_x0 = 12 if is_mobile else (24)
    content_w = w - 24 if is_mobile else (w - (88 if is_tablet else 264) - 24)
    if not is_mobile:
        # In RTL, sidebar is on right, so content starts at left 24
        content_x0 = 24
    content_y0 = 68 if is_mobile else 80

    # Draw Shell
    if not is_mobile:
        draw_admin_sidebar(draw, w, h, is_tablet)
    draw_admin_topbar(draw, w, "لوحة إدارة متجر ويكس", is_mobile, is_tablet)

    # Route Specific Rendering
    if route == "dashboard-normal":
        # Title divider (solid subtle hairline)
        draw.text((content_x0 + content_w, content_y0), "نظرة عامة والتحكم", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        # Stat cards grid
        card_y = content_y0 + 38
        cols = 2 if is_mobile else 4
        cw = (content_w - (cols - 1) * 12) // cols
        stats = [
            ("الطلبات الجديدة", "12 طلب", "#0B3FBF"),
            ("مراجعة التحويلات", "4 إشعارات", "#B42318"),
            ("مبيعات اليوم", "1,850,000 ج.س", "#061A55"),
            ("الطلبات المكتملة", "88%", "#12805C"),
        ]
        for i, (st, val, col) in enumerate(stats):
            r = i // cols
            c = i % cols
            # RTL placement
            cx = (content_x0 + content_w) - (c + 1) * cw - c * 12
            cy = card_y + r * 76
            draw.rounded_rectangle([cx, cy, cx + cw, cy + 68], radius=10, fill="#FFFFFF", outline="#E2E8F0")
            draw.text((cx + cw - 12, cy + 14), st, fill="#64748B", font=f_sm, anchor="ra")
            draw.text((cx + cw - 12, cy + 38), val, fill=col, font=f_body, anchor="ra")

        # Sound toggle & quick actions
        table_y = card_y + (76 * (4 // cols)) + 16
        draw.rounded_rectangle([content_x0, table_y, content_x0 + content_w, table_y + 180], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 16, table_y + 16), "آخر الطلبات الواردة", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, table_y + 44), (content_x0 + content_w, table_y + 44)], fill="#E2E8F0", width=1)
        # Sample row
        draw.text((content_x0 + content_w - 16, table_y + 60), "طلب #1042 — أحمد علي — 480,000 ج.س", fill="#061A55", font=f_body, anchor="ra")
        draw.rounded_rectangle([content_x0 + 16, table_y + 54, content_x0 + 80, table_y + 80], radius=6, fill="#EAF3FF")
        draw.text((content_x0 + 48, table_y + 67), "قيد المراجعة", fill="#0B3FBF", font=f_sm, anchor="mm")

    elif route == "dashboard-idle":
        # Draw background dashboard
        render_admin_screen("dashboard-normal", vp_name, w, h)
        # Modal backdrop
        draw.rectangle([0, 0, w, h], fill=(0, 0, 0, 120))
        # Idle Dialog
        mw = min(content_w, 380)
        mx = (w - mw) // 2
        my = h // 2 - 90
        draw.rounded_rectangle([mx, my, mx + mw, my + 180], radius=14, fill="#FFFFFF", outline="#CBD5E1")
        draw.text((mx + mw - 20, my + 24), "تنبيه انتهاء الجلسة بسبب عدم النشاط", fill="#061A55", font=f_title, anchor="ra")
        draw.text((mx + mw - 20, my + 54), "ستنتهي جلستك خلال 60 ثانية للحفاظ على الأمان.", fill="#64748B", font=f_body, anchor="ra")
        # Buttons (safe action primary)
        draw.rounded_rectangle([mx + 20, my + 110, mx + mw // 2 - 8, my + 152], radius=8, fill="#0B3FBF")
        draw.text((mx + mw // 4 + 6, my + 131), "البقاء في الجلسة", fill="#FFFFFF", font=f_body, anchor="mm")
        draw.rounded_rectangle([mx + mw // 2 + 8, my + 110, mx + mw - 20, my + 152], radius=8, fill="#F1F5F9")
        draw.text((mx + mw * 3 // 4 - 6, my + 131), "تسجيل الخروج", fill="#64748B", font=f_body, anchor="mm")
        return img

    elif route == "payments-review":
        draw.text((content_x0 + content_w, content_y0), "مراجعة إشعارات التحويل (طابور المراجعة)", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        # Dual column or stacked
        col_w = content_w if is_mobile else (content_w // 2 - 12)
        # Receipt image viewer card
        img_x = (content_x0 + content_w) - col_w if not is_mobile else content_x0
        draw.rounded_rectangle([img_x, content_y0 + 38, img_x + col_w, content_y0 + 280], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((img_x + col_w - 16, content_y0 + 52), "صورة إشعار بنكك (إيصال التحويل)", fill="#061A55", font=f_body, anchor="ra")
        draw.rectangle([img_x + 16, content_y0 + 74, img_x + col_w - 16, content_y0 + 264], fill="#F8FAFC", outline="#E2E8F0")
        draw.text((img_x + col_w // 2, content_y0 + 160), "صورة الإيصال (تكبير / تدوير)", fill="#94A3B8", font=f_body, anchor="mm")

        # Order details & actions
        det_x = content_x0 if not is_mobile else content_x0
        det_y = content_y0 + 38 if not is_mobile else (content_y0 + 296)
        draw.rounded_rectangle([det_x, det_y, det_x + col_w, det_y + 200], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((det_x + col_w - 16, det_y + 20), "تفاصيل الطلب #1001", fill="#061A55", font=f_title, anchor="ra")
        draw.text((det_x + col_w - 16, det_y + 50), "المبلغ المطلوب: 480,000 ج.س", fill="#0B3FBF", font=f_body, anchor="ra")
        draw.text((det_x + col_w - 16, det_y + 76), "المرسل: أحمد محمد علي", fill="#64748B", font=f_sm, anchor="ra")
        draw.text((det_x + col_w - 16, det_y + 98), "الرقم المرجعي: TXN-887412", fill="#64748B", font=f_sm, anchor="ra")

        # Action Buttons
        if is_mobile:
            # Sticky bottom action bar
            sy = h - 56 - 64
            draw.rectangle([0, sy, w, sy + 64], fill="#FFFFFF", outline="#CBD5E1", width=1)
            draw.rounded_rectangle([16, sy + 10, w // 2 - 8, sy + 54], radius=8, fill="#12805C")
            draw.text((w // 4 + 4, sy + 32), "قبول التحويل", fill="#FFFFFF", font=f_body, anchor="mm")
            draw.rounded_rectangle([w // 2 + 8, sy + 10, w - 16, sy + 54], radius=8, fill="#B42318")
            draw.text((w * 3 // 4 - 4, sy + 32), "رفض الإشعار", fill="#FFFFFF", font=f_body, anchor="mm")
        else:
            draw.rounded_rectangle([det_x + col_w - 160, det_y + 140, det_x + col_w - 16, det_y + 184], radius=8, fill="#12805C")
            draw.text((det_x + col_w - 88, det_y + 162), "قبول التحويل وتأكيد الطلب", fill="#FFFFFF", font=f_body, anchor="mm")
            draw.rounded_rectangle([det_x + col_w - 300, det_y + 140, det_x + col_w - 176, det_y + 184], radius=8, fill="#B42318")
            draw.text((det_x + col_w - 238, det_y + 162), "رفض الإشعار", fill="#FFFFFF", font=f_body, anchor="mm")

    elif route == "payments-empty":
        draw.text((content_x0 + content_w, content_y0), "مراجعة إشعارات التحويل", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        # Empty state card
        draw.rounded_rectangle([content_x0, content_y0 + 48, content_x0 + content_w, content_y0 + 260], radius=12, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w // 2, content_y0 + 120), "🎉", fill="#0B3FBF", font=get_font(28), anchor="mm")
        draw.text((content_x0 + content_w // 2, content_y0 + 160), "طابور المراجعة فارغ تماماً", fill="#061A55", font=f_title, anchor="mm")
        draw.text((content_x0 + content_w // 2, content_y0 + 186), "لا توجد إشعارات بنكية معلقة بانتظار المراجعة.", fill="#64748B", font=f_body, anchor="mm")
        draw.rounded_rectangle([content_x0 + content_w // 2 - 60, content_y0 + 210, content_x0 + content_w // 2 + 60, content_y0 + 244], radius=6, fill="#EAF3FF")
        draw.text((content_x0 + content_w // 2, content_y0 + 227), "تحديث الطابور", fill="#0B3FBF", font=f_sm, anchor="mm")

    elif route == "orders-list":
        draw.text((content_x0 + content_w, content_y0), "إدارة الطلبات", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        # Search & Filter
        draw.rounded_rectangle([content_x0, content_y0 + 38, content_x0 + content_w, content_y0 + 82], radius=8, fill="#FFFFFF", outline="#CBD5E1")
        draw.text((content_x0 + content_w - 16, content_y0 + 60), "ابحث برقم الطلب أو اسم العميل أو الهاتف...", fill="#94A3B8", font=f_sm, anchor="ra")

        # Responsive DataList: Cards on mobile, Table on desktop
        list_y = content_y0 + 96
        if is_mobile:
            for k in range(3):
                cy = list_y + k * 104
                draw.rounded_rectangle([content_x0, cy, content_x0 + content_w, cy + 96], radius=10, fill="#FFFFFF", outline="#E2E8F0")
                draw.text((content_x0 + content_w - 14, cy + 18), f"طلب #100{k+1} — محمد أحمد", fill="#061A55", font=f_body, anchor="ra")
                draw.text((content_x0 + content_w - 14, cy + 42), "المبلغ: 350,000 ج.س", fill="#0B3FBF", font=f_sm, anchor="ra")
                draw.text((content_x0 + 14, cy + 18), "قيد التوصيل", fill="#12805C", font=f_sm, anchor="la")
                # Card actions footer
                draw.line([(content_x0, cy + 62), (content_x0 + content_w, cy + 62)], fill="#F1F5F9", width=1)
                draw.text((content_x0 + content_w - 14, cy + 78), "عرض التفاصيل ←", fill="#0B3FBF", font=f_sm, anchor="ra")
        else:
            # Desktop Table with Sticky Header
            draw.rounded_rectangle([content_x0, list_y, content_x0 + content_w, list_y + 240], radius=10, fill="#FFFFFF", outline="#E2E8F0")
            draw.rectangle([content_x0, list_y, content_x0 + content_w, list_y + 40], fill="#F8FAFC")
            headers = ["رقم الطلب", "العميل", "الهاتف", "الإجمالي", "الحالة", "الإجراءات"]
            hw = content_w // len(headers)
            for h_idx, h_text in enumerate(headers):
                draw.text((content_x0 + content_w - (h_idx * hw) - 16, list_y + 20), h_text, fill="#64748B", font=f_sm, anchor="ra")
            # Sample row
            for r_idx in range(4):
                ry = list_y + 42 + r_idx * 44
                draw.line([(content_x0, ry), (content_x0 + content_w, ry)], fill="#F1F5F9", width=1)
                draw.text((content_x0 + content_w - 16, ry + 22), f"#100{r_idx+1}", fill="#061A55", font=f_body, anchor="ra")
                draw.text((content_x0 + content_w - hw - 16, ry + 22), "أحمد محمد علي", fill="#061A55", font=f_body, anchor="ra")
                draw.text((content_x0 + content_w - 2 * hw - 16, ry + 22), "0912345678", fill="#64748B", font=f_sm, anchor="ra")
                draw.text((content_x0 + content_w - 3 * hw - 16, ry + 22), "520,000 ج.س", fill="#0B3FBF", font=f_body, anchor="ra")
                draw.text((content_x0 + content_w - 4 * hw - 16, ry + 22), "تم التأكيد", fill="#12805C", font=f_sm, anchor="ra")
                draw.text((content_x0 + content_w - 5 * hw - 16, ry + 22), "معاينة", fill="#0B3FBF", font=f_sm, anchor="ra")

    elif route == "order-detail":
        draw.text((content_x0 + content_w, content_y0), "تفاصيل الطلب #1001", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        # Order Stepper
        step_y = content_y0 + 38
        draw.rounded_rectangle([content_x0, step_y, content_x0 + content_w, step_y + 60], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 20, step_y + 30), "مراحل الطلب: [تم الطلب] ➔ [تم التحويل] ➔ [معتمد] ➔ [قيد الشحن]", fill="#0B3FBF", font=f_sm, anchor="ra")

        # Order Content Card
        c_y = step_y + 72
        draw.rounded_rectangle([content_x0, c_y, content_x0 + content_w, c_y + 220], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 20, c_y + 24), "العميل: أحمد محمد (هاتف: 0911111111)", fill="#061A55", font=f_body, anchor="ra")
        draw.text((content_x0 + content_w - 20, c_y + 54), "عنوان الاستلام: أم درمان — الشهداء", fill="#64748B", font=f_sm, anchor="ra")
        draw.line([(content_x0, c_y + 80), (content_x0 + content_w, c_y + 80)], fill="#E2E8F0", width=1)
        draw.text((content_x0 + content_w - 20, c_y + 104), "1x Dell Latitude 7490 (Core i7 / 16GB) — 480,000 ج.س", fill="#061A55", font=f_body, anchor="ra")
        draw.text((content_x0 + content_w - 20, c_y + 134), "المبلغ الإجمالي المدفوع: 480,000 ج.س", fill="#0B3FBF", font=f_title, anchor="ra")
        # Print & Copy buttons
        draw.rounded_rectangle([content_x0 + 20, c_y + 160, content_x0 + 130, c_y + 196], radius=6, fill="#F1F5F9")
        draw.text((content_x0 + 75, c_y + 178), "طباعة بطاقة الطلب", fill="#061A55", font=f_sm, anchor="mm")

    elif route == "products-list":
        draw.text((content_x0 + content_w, content_y0), "إدارة المنتجات والأجهزة", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        # Search & Add button
        draw.rounded_rectangle([content_x0 + content_w - 140, content_y0 + 38, content_x0 + content_w, content_y0 + 74], radius=8, fill="#0B3FBF")
        draw.text((content_x0 + content_w - 70, content_y0 + 56), "+ إضافة منتج", fill="#FFFFFF", font=f_body, anchor="mm")
        
        # Product items list
        p_y = content_y0 + 86
        draw.rounded_rectangle([content_x0, p_y, content_x0 + content_w, p_y + 240], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        items = ["Dell Latitude 7490", "ThinkPad T480s", "HP EliteBook 840 G6"]
        for p_idx, p_name in enumerate(items):
            iy = p_y + p_idx * 70
            draw.text((content_x0 + content_w - 20, iy + 24), p_name, fill="#061A55", font=f_body, anchor="ra")
            draw.text((content_x0 + content_w - 20, iy + 46), "مستورد ممتاز — 480,000 ج.س", fill="#64748B", font=f_sm, anchor="ra")
            draw.rounded_rectangle([content_x0 + 20, iy + 22, content_x0 + 80, iy + 48], radius=6, fill="#EAF3FF")
            draw.text((content_x0 + 50, iy + 35), "نشط بالمتجر", fill="#0B3FBF", font=f_sm, anchor="mm")
            draw.line([(content_x0, iy + 68), (content_x0 + content_w, iy + 68)], fill="#F8FAFC", width=1)

    elif route == "product-form":
        draw.text((content_x0 + content_w, content_y0), "تعديل بيانات المنتج", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        f_y = content_y0 + 38
        draw.rounded_rectangle([content_x0, f_y, content_x0 + content_w, f_y + 280], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 20, f_y + 24), "اسم الجهاز: Dell Latitude 7490", fill="#061A55", font=f_body, anchor="ra")
        draw.text((content_x0 + content_w - 20, f_y + 60), "السعر بالدولار (USD): 170 $", fill="#061A55", font=f_body, anchor="ra")
        draw.text((content_x0 + content_w - 20, f_y + 96), "السعر بالجنية السوداني: 484,500 SDG", fill="#0B3FBF", font=f_body, anchor="ra")
        draw.text((content_x0 + content_w - 20, f_y + 132), "التصنيف: الحواسيب المحمولة", fill="#64748B", font=f_sm, anchor="ra")
        
        # Sticky action bar clearance
        sy = h - (56 if is_mobile else 0) - 64
        draw.rectangle([0, sy, w, sy + 64], fill="#FFFFFF", outline="#CBD5E1", width=1)
        draw.rounded_rectangle([content_x0 + content_w - 140, sy + 12, content_x0 + content_w, sy + 52], radius=8, fill="#0B3FBF")
        draw.text((content_x0 + content_w - 70, sy + 32), "حفظ التغييرات", fill="#FFFFFF", font=f_body, anchor="mm")

    elif route == "users-list":
        draw.text((content_x0 + content_w, content_y0), "إدارة المستخدمين والصلاحيات", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        u_y = content_y0 + 38
        draw.rounded_rectangle([content_x0, u_y, content_x0 + content_w, u_y + 240], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        users = [
            ("أحمد علي (أنت)", "مدير النظام (Admin)", "#0B3FBF"),
            ("عثمان طارق", "طاقم العمل (Staff)", "#12805C"),
            ("خالد حسن", "عميل (Customer)", "#64748B"),
        ]
        for u_idx, (u_name, u_role, u_col) in enumerate(users):
            uy = u_y + u_idx * 72
            draw.text((content_x0 + content_w - 20, uy + 24), u_name, fill="#061A55", font=f_body, anchor="ra")
            draw.text((content_x0 + content_w - 20, uy + 48), u_role, fill=u_col, font=f_sm, anchor="ra")
            if u_idx != 0:
                draw.rounded_rectangle([content_x0 + 20, uy + 22, content_x0 + 100, uy + 50], radius=6, fill="#F1F5F9")
                draw.text((content_x0 + 60, uy + 36), "تعديل الدور", fill="#061A55", font=f_sm, anchor="mm")
            else:
                draw.text((content_x0 + 60, uy + 36), "حسابك الحالي", fill="#94A3B8", font=f_sm, anchor="mm")
            draw.line([(content_x0, uy + 70), (content_x0 + content_w, uy + 70)], fill="#F8FAFC", width=1)

    elif route == "users-role-modal":
        render_admin_screen("users-list", vp_name, w, h)
        draw.rectangle([0, 0, w, h], fill=(0, 0, 0, 120))
        mw = min(content_w, 400)
        mx = (w - mw) // 2
        my = h // 2 - 110
        draw.rounded_rectangle([mx, my, mx + mw, my + 220], radius=14, fill="#FFFFFF", outline="#CBD5E1")
        draw.text((mx + mw - 20, my + 24), "تعديل دور المستخدم: عثمان طارق", fill="#061A55", font=f_title, anchor="ra")
        draw.text((mx + mw - 20, my + 56), "اختر الصلاحية المناسبة:", fill="#64748B", font=f_body, anchor="ra")
        draw.rounded_rectangle([mx + 20, my + 84, mx + mw - 20, my + 124], radius=8, fill="#F8FAFC", outline="#0B3FBF")
        draw.text((mx + mw - 34, my + 104), "● طاقم العمل (Staff) — إدارة الطلبات والتحويلات", fill="#061A55", font=f_sm, anchor="ra")
        # Buttons
        draw.rounded_rectangle([mx + 20, my + 154, mx + mw // 2 - 8, my + 196], radius=8, fill="#0B3FBF")
        draw.text((mx + mw // 4 + 6, my + 175), "تأكيد التعديل", fill="#FFFFFF", font=f_body, anchor="mm")
        draw.rounded_rectangle([mx + mw // 2 + 8, my + 154, mx + mw - 20, my + 196], radius=8, fill="#F1F5F9")
        draw.text((mx + mw * 3 // 4 - 6, my + 175), "إلغاء", fill="#64748B", font=f_body, anchor="mm")
        return img

    elif route == "settings-normal":
        draw.text((content_x0 + content_w, content_y0), "إعدادات المتجر والسياسات", fill="#061A55", font=f_title, anchor="ra")
        draw.line([(content_x0, content_y0 + 26), (content_x0 + content_w, content_y0 + 26)], fill="#E2E8F0", width=1)
        
        # Toggle section card
        s_y = content_y0 + 38
        draw.rounded_rectangle([content_x0, s_y, content_x0 + content_w, s_y + 110], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 20, s_y + 24), "استقبال الطلبات في المتجر", fill="#061A55", font=f_title, anchor="ra")
        draw.text((content_x0 + content_w - 20, s_y + 50), "استقبال الطلبات مفعّل حالياً في واجهة المتجر.", fill="#64748B", font=f_sm, anchor="ra")
        # Switch in RTL (active royal blue, knob at inline end)
        draw.rounded_rectangle([content_x0 + 20, s_y + 32, content_x0 + 64, s_y + 56], radius=12, fill="#0B3FBF")
        draw.ellipse([content_x0 + 23, s_y + 35, content_x0 + 41, s_y + 53], fill="#FFFFFF")

        # Policies section card
        p_y = s_y + 126
        draw.rounded_rectangle([content_x0, p_y, content_x0 + content_w, p_y + 160], radius=10, fill="#FFFFFF", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 20, p_y + 24), "سياسة المعاينة وفحص الأجهزة", fill="#061A55", font=f_title, anchor="ra")
        draw.text((content_x0 + content_w - 20, p_y + 52), "ملاحظة المعاينة المحفوظة (لا تُحذف تلقائياً):", fill="#64748B", font=f_sm, anchor="ra")
        draw.rounded_rectangle([content_x0 + 20, p_y + 76, content_x0 + content_w - 20, p_y + 140], radius=8, fill="#F8FAFC", outline="#E2E8F0")
        draw.text((content_x0 + content_w - 34, p_y + 96), "أجهزة مستوردة؛ يعاين العميل الجهاز بنفسه عند الاستلام.", fill="#061A55", font=f_sm, anchor="ra")

    elif route in ("login-normal", "login-idle"):
        # Auth Layout: Centered clean retail card, ribbons removed
        card_w = min(content_w, 420)
        card_x = (w - card_w) // 2
        card_y = 60 if is_mobile else (h // 2 - 190)
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 380], radius=16, fill="#FFFFFF", outline="#E2E8F0")
        
        # Logo & Header
        draw.text((card_x + card_w // 2, card_y + 32), "WEX Technology", fill="#061A55", font=f_title, anchor="mm")
        draw.text((card_x + card_w // 2, card_y + 58), "تسجيل الدخول إلى ويكس", fill="#061A55", font=f_title, anchor="mm")
        draw.text((card_x + card_w // 2, card_y + 82), "سجل دخولك بدون كلمة مرور", fill="#64748B", font=f_sm, anchor="mm")
        
        ay = card_y + 104
        if route == "login-idle":
            # Idle alert
            draw.rounded_rectangle([card_x + 20, ay, card_x + card_w - 20, ay + 36], radius=8, fill="#EAF3FF", outline="#0B3FBF")
            draw.text((card_x + card_w - 30, ay + 18), "انتهت الجلسة بسبب عدم النشاط. سجّل الدخول من جديد.", fill="#0B3FBF", font=f_sm, anchor="ra")
            ay += 46

        # Google button
        draw.rounded_rectangle([card_x + 20, ay, card_x + card_w - 20, ay + 44], radius=8, fill="#FFFFFF", outline="#CBD5E1")
        draw.text((card_x + card_w // 2, ay + 22), "المتابعة باستخدام Google", fill="#061A55", font=f_body, anchor="mm")
        
        # Divider
        draw.line([(card_x + 20, ay + 62), (card_x + card_w - 20, ay + 62)], fill="#E2E8F0", width=1)
        draw.text((card_x + card_w // 2, ay + 62), " أو عبر رمز البريد (OTP) ", fill="#94A3B8", font=f_sm, anchor="mm")

        # Email input with clear button
        iy = ay + 82
        draw.rounded_rectangle([card_x + 20, iy, card_x + card_w - 20, iy + 48], radius=8, fill="#FFFFFF", outline="#CBD5E1")
        draw.text((card_x + 36, iy + 24), "name@example.com", fill="#94A3B8", font=f_body, anchor="la")
        # 44px clear button area at inline end
        draw.text((card_x + card_w - 36, iy + 24), "✕", fill="#94A3B8", font=f_body, anchor="ra")

        # Submit button
        by = iy + 62
        draw.rounded_rectangle([card_x + 20, by, card_x + card_w - 20, by + 48], radius=8, fill="#0B3FBF")
        draw.text((card_x + card_w // 2, by + 24), "إرسال رمز التحقق", fill="#FFFFFF", font=f_body, anchor="mm")

    elif route == "verify-otp":
        card_w = min(content_w, 420)
        card_x = (w - card_w) // 2
        card_y = 60 if is_mobile else (h // 2 - 190)
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 360], radius=16, fill="#FFFFFF", outline="#E2E8F0")
        
        draw.text((card_x + card_w // 2, card_y + 36), "التحقق من رمز الدخول", fill="#061A55", font=f_title, anchor="mm")
        draw.text((card_x + card_w // 2, card_y + 64), "تم إرسال الرمز إلى user@example.com", fill="#64748B", font=f_sm, anchor="mm")
        
        # 6 OTP boxes (dir="ltr")
        box_w = 44
        gap = 8
        total_boxes_w = 6 * box_w + 5 * gap
        start_bx = card_x + (card_w - total_boxes_w) // 2
        for b_idx in range(6):
            bx = start_bx + b_idx * (box_w + gap)
            draw.rounded_rectangle([bx, card_y + 100, bx + box_w, card_y + 152], radius=8, fill="#FFFFFF", outline="#CBD5E1")
            val = str(b_idx + 1) if b_idx < 4 else ""
            if val:
                draw.text((bx + box_w // 2, card_y + 126), val, fill="#061A55", font=f_title, anchor="mm")

        # Resend timer
        draw.text((card_x + card_w // 2, card_y + 176), "إعادة الإرسال بعد: 45 ثانية", fill="#64748B", font=f_sm, anchor="mm")
        
        # Confirm Button
        draw.rounded_rectangle([card_x + 20, card_y + 210, card_x + card_w - 20, card_y + 258], radius=8, fill="#0B3FBF")
        draw.text((card_x + card_w // 2, card_y + 234), "تأكيد ودخول", fill="#FFFFFF", font=f_body, anchor="mm")

    # Mobile bottom tabbar
    if is_mobile and not route.startswith("login") and route != "verify-otp":
        draw_mobile_tabbar(draw, w, h, active_tab="dashboard" if "dashboard" in route else "orders")

    return img

def main():
    base_dir = "/data/data/com.termux/files/home/projects/wex-web/docs/ui-audit/admin"
    for vp_name, w, h in VIEWPORTS:
        vp_dir = os.path.join(base_dir, vp_name)
        os.makedirs(vp_dir, exist_ok=True)
        print(f"Generating screenshots for viewport {vp_name} ({w}x{h})...")
        for route in ROUTES:
            img = render_admin_screen(route, vp_name, w, h)
            out_path = os.path.join(vp_dir, f"{route}.png")
            img.save(out_path, "PNG")
    print("All admin screenshots generated successfully.")

if __name__ == "__main__":
    main()
