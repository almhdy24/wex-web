#!/usr/bin/env python3
"""
Generate high-fidelity mobile screenshots (360x800 and 390x844) for:
home, store, product-detail, cart, checkout, orders, order-detail, login, favorites, compare, account, notifications, faq.
"""
import sys
import os
from PIL import Image, ImageDraw, ImageFont

VIEWPORTS = [
    ("360", 360, 800),
    ("390", 390, 844),
]

PAGES = [
    "home",
    "store",
    "product-detail",
    "cart",
    "checkout",
    "orders",
    "order-detail",
    "login",
    "favorites",
    "compare",
    "account",
    "notifications",
    "faq"
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

def draw_top_bar(draw, w, title, mode="before", show_back=True):
    # App Bar (56px)
    draw.rectangle([0, 0, w, 56], fill="#FFFFFF", outline="#D5E2F7", width=1)
    font_t = get_font(16)
    font_s = get_font(12)
    # Right-aligned app title or center title
    draw.text((w - 20, 18), title, fill="#061A55", font=font_t, anchor="ra")
    if show_back:
        draw.text((20, 18), "←", fill="#0B3FBF", font=font_t, anchor="la")

def draw_bottom_tab_bar(draw, w, h, active_tab="home", mode="before"):
    # Bottom Tab Bar (56px)
    tab_y = h - 64
    draw.rectangle([0, tab_y, w, h], fill="#FFFFFF", outline="#D5E2F7", width=1)
    tabs = [("الرئيسية", "home"), ("المتجر", "store"), ("المفضلة", "favorites"), ("السلة", "cart"), ("الحساب", "account")]
    step = w // len(tabs)
    font_s = get_font(10)

    # In "after" mode, draw active sliding indicator
    if mode == "after":
        for i, (name, key) in enumerate(tabs):
            if key == active_tab:
                # Sliding pill indicator behind active tab
                cx = i * step + step // 2
                draw.rounded_rectangle([cx - 24, tab_y + 6, cx + 24, tab_y + 44], radius=12, fill="#EAF3FF")
                # Cyan top active dot
                draw.ellipse([cx - 3, tab_y + 2, cx + 3, tab_y + 8], fill="#00B7FF")

    for i, (name, key) in enumerate(tabs):
        cx = i * step + step // 2
        is_active = (key == active_tab)
        color = "#0B3FBF" if is_active else "#4B5B85"
        # icon placeholder
        draw.text((cx, tab_y + 16), "•", fill=color, font=get_font(16), anchor="mm")
        draw.text((cx, tab_y + 36), name, fill=color, font=font_s, anchor="mm")

def draw_linear_gradient(img, xy, color1, color2, vertical=False):
    x0, y0, x1, y1 = xy
    w = x1 - x0
    h = y1 - y0
    draw = ImageDraw.Draw(img)
    steps = h if vertical else w
    for i in range(steps):
        r = int(color1[0] + (color2[0] - color1[0]) * (i / max(1, steps)))
        g = int(color1[1] + (color2[1] - color1[1]) * (i / max(1, steps)))
        b = int(color1[2] + (color2[2] - color1[2]) * (i / max(1, steps)))
        if vertical:
            draw.line([(x0, y0 + i), (x1, y0 + i)], fill=(r, g, b))
        else:
            draw.line([(x0 + i, y0), (x0 + i, y1)], fill=(r, g, b))

def render_screen(page, mode, vp_name, w, h):
    bg_color = (234, 243, 255) # Ice blue #EAF3FF
    img = Image.new("RGB", (w, h), bg_color)
    draw = ImageDraw.Draw(img)
    font_title = get_font(18)
    font_body = get_font(13)
    font_caption = get_font(11)

    pad = 16 if mode == "after" else (16 if page not in ["cart", "checkout", "product-detail"] else 0)
    card_rad = 16 if mode == "after" else (8 if page in ["cart", "checkout"] else 12)

    if page == "home":
        # AppBar
        draw_top_bar(draw, w, "Wex Technology", mode, show_back=False)
        # Search Box
        draw.rectangle([16, 70, w - 16, 114], fill="#FFFFFF", outline="#D5E2F7", width=1)
        draw.text((w - 30, 85), "ابحث عن جهاز...", fill="#4B5B85", font=font_body, anchor="ra")
        # Freshness dot
        dot_color = "#00B7FF" if mode == "after" else "#4B5B85"
        draw.ellipse([w - 24, 122, w - 18, 128], fill=dot_color)
        draw.text((w - 30, 120), "اخر تحديث للاسعار: اليوم 12:00 م", fill="#4B5B85", font=font_caption, anchor="ra")

        # Hero
        hero_y = 140
        hero_h = 160
        if mode == "before":
            # Flat navy hero
            draw.rectangle([16, hero_y, w - 16, hero_y + hero_h], fill="#061A55")
        else:
            # Official brand gradient #0B3FBF -> #1E6BFF -> #00B7FF
            draw_linear_gradient(img, (16, hero_y, w - 16, hero_y + hero_h), (11, 63, 191), (0, 183, 255))
            # Ribbon overlay accent
            draw.line([(16, hero_y + hero_h), (w - 16, hero_y)], fill=(30, 107, 255), width=3)

        draw.text((w - 30, hero_y + 24), "اجهزة لابتوب جديدة ومستعملة", fill="#FFFFFF", font=font_title, anchor="ra")
        draw.text((w - 30, hero_y + 60), "تصفح الاجهزة المتوفرة باسعار واضحة", fill="#C9D6F5", font=font_body, anchor="ra")
        btn_bg = "#FFFFFF" if mode == "after" else "#0B3FBF"
        btn_txt = "#061A55" if mode == "after" else "#FFFFFF"
        draw.rounded_rectangle([w - 140, hero_y + 100, w - 30, hero_y + 138], radius=8, fill=btn_bg)
        draw.text((w - 85, hero_y + 112), "تصفح الاجهزة ←", fill=btn_txt, font=font_caption, anchor="mm")

        # Categories
        cat_y = hero_y + hero_h + 16
        draw.text((w - 20, cat_y), "التصنيفات", fill="#061A55", font=font_title, anchor="ra")
        for i, cname in enumerate(["الحواسيب", "الهواتف", "الملحقات"]):
            cx0 = 16 + i * ((w - 32) // 3)
            cx1 = cx0 + ((w - 32) // 3) - 8
            draw.rounded_rectangle([cx0, cat_y + 26, cx1, cat_y + 66], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
            draw.text(((cx0 + cx1)//2, cat_y + 40), cname, fill="#061A55", font=font_caption, anchor="mm")

        # Section: Products
        prod_y = cat_y + 80
        if mode == "before":
            draw.text((w - 20, prod_y), "وصل حديثا (مكرر)", fill="#061A55", font=font_title, anchor="ra")
        else:
            draw.text((w - 20, prod_y), "اجهزة مختارة", fill="#061A55", font=font_title, anchor="ra")
            draw.text((20, prod_y), "كل الاجهزة ←", fill="#0B3FBF", font=font_caption, anchor="la")

        # 2 product cards preview
        for j in range(2):
            px0 = 16 + j * ((w - 36) // 2)
            px1 = px0 + ((w - 36) // 2)
            draw.rounded_rectangle([px0, prod_y + 26, px1, prod_y + 180], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
            draw.rectangle([px0 + 8, prod_y + 34, px1 - 8, prod_y + 110], fill="#F4F8FE")
            draw.text(((px0+px1)//2, prod_y + 120), f"جهاز مميز {j+1}", fill="#061A55", font=font_caption, anchor="mm")
            draw.text(((px0+px1)//2, prod_y + 140), "450,000 SDG", fill="#0B3FBF", font=font_caption, anchor="mm")
            # add button
            btn_col = (11, 63, 191) if mode == "before" else (30, 107, 255)
            draw.rounded_rectangle([px0 + 12, prod_y + 152, px1 - 12, prod_y + 172], radius=6, fill=btn_col)
            draw.text(((px0+px1)//2, prod_y + 158), "اضف للسلة", fill="#FFFFFF", font=get_font(9), anchor="mm")

        draw_bottom_tab_bar(draw, w, h, active_tab="home", mode=mode)

    elif page == "cart":
        draw_top_bar(draw, w, "سلة المشتريات", mode, show_back=True)
        cy = 66
        if mode == "before":
            # Duplicate header under app bar
            draw.text((w - 16, cy), "السلة", fill="#061A55", font=font_title, anchor="ra")
            cy += 30
            # Edge-to-edge item card (no margins/radius)
            draw.rectangle([0, cy, w, cy + 90], fill="#FFFFFF", outline="#D5E2F7")
            draw.rectangle([w - 86, cy + 8, w - 8, cy + 82], fill="#F4F8FE")
            draw.text((w - 100, cy + 18), "Dell Latitude 7490", fill="#061A55", font=font_body, anchor="ra")
            draw.text((w - 100, cy + 42), "487,500 SDG", fill="#0B3FBF", font=font_body, anchor="ra")
            # Full bleed flat CTA sticky bar
            draw.rectangle([0, h - 56, w, h], fill="#0B3FBF")
            draw.text((w // 2, h - 34), "متابعة الطلب — 487,500 SDG", fill="#FFFFFF", font=font_body, anchor="mm")
        else:
            # After: clean layout, rounded padded item card
            draw.rounded_rectangle([16, cy, w - 16, cy + 96], radius=16, fill="#FFFFFF", outline="#D5E2F7")
            draw.rounded_rectangle([w - 96, cy + 10, w - 24, cy + 86], radius=12, fill="#F4F8FE")
            draw.text((w - 110, cy + 20), "Dell Latitude 7490", fill="#061A55", font=font_body, anchor="ra")
            draw.text((w - 110, cy + 45), "487,500 SDG", fill="#0B3FBF", font=font_body, anchor="ra")
            draw.text((w - 110, cy + 68), "الكمية: 1", fill="#4B5B85", font=font_caption, anchor="ra")

            # Summary card
            draw.rounded_rectangle([16, cy + 110, w - 16, cy + 220], radius=16, fill="#FFFFFF", outline="#D5E2F7")
            draw.text((w - 30, cy + 125), "ملخص الطلب", fill="#061A55", font=font_title, anchor="ra")
            draw.text((w - 30, cy + 155), "المجموع: 487,500 SDG", fill="#4B5B85", font=font_body, anchor="ra")
            draw.text((w - 30, cy + 180), "خصم التطبيق (3%): -14,625 SDG", fill="#12805C", font=font_body, anchor="ra")

            # Floating padded rounded CTA bar
            draw_linear_gradient(img, (16, h - 74, w - 16, h - 22), (11, 63, 191), (0, 183, 255))
            draw.text((w // 2, h - 52), "متابعة الطلب — 472,875 SDG", fill="#FFFFFF", font=font_body, anchor="mm")

    elif page == "checkout":
        draw_top_bar(draw, w, "إتمام الطلب", mode, show_back=True)
        cy = 70
        # Stepper
        for s_idx, s_lbl in enumerate(["الاستلام", "التواصل", "المراجعة"]):
            sx = 20 + s_idx * ((w - 40) // 3)
            s_col = "#0B3FBF" if s_idx == 0 else "#D5E2F7"
            draw.ellipse([sx + 30, cy, sx + 50, cy + 20], fill=s_col)
            draw.text((sx + 40, cy + 8), str(s_idx + 1), fill="#FFFFFF", font=font_caption, anchor="mm")
            draw.text((sx + 40, cy + 26), s_lbl, fill="#061A55", font=font_caption, anchor="mm")

        cy += 50
        # Options
        draw.rounded_rectangle([16, cy, w - 16, cy + 120], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        draw.text((w - 30, cy + 20), "طريقة الاستلام", fill="#061A55", font=font_title, anchor="ra")
        draw.rounded_rectangle([28, cy + 50, w - 28, cy + 96], radius=10, fill="#EAF3FF", outline="#0B3FBF")
        draw.text((w - 40, cy + 65), "استلام من مقر المحل (مول الواحة)", fill="#061A55", font=font_body, anchor="ra")

        cy += 140
        draw.rounded_rectangle([16, cy, w - 16, cy + 160], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        draw.text((w - 30, cy + 20), "بيانات المستلم", fill="#061A55", font=font_title, anchor="ra")
        draw.rectangle([28, cy + 50, w - 28, cy + 86], fill="#F4F8FE", outline="#D5E2F7")
        draw.text((w - 40, cy + 62), "الاسم بالكامل", fill="#4B5B85", font=font_caption, anchor="ra")
        draw.rectangle([28, cy + 96, w - 28, cy + 132], fill="#F4F8FE", outline="#D5E2F7")
        draw.text((w - 40, cy + 108), "رقم الهاتف (249...)", fill="#4B5B85", font=font_caption, anchor="ra")

        # CTA
        btn_y = h - 64
        if mode == "before":
            draw.rectangle([0, btn_y, w, h], fill="#0B3FBF")
            draw.text((w // 2, btn_y + 24), "تأكيد الطلب وقفل السعر", fill="#FFFFFF", font=font_body, anchor="mm")
        else:
            draw_linear_gradient(img, (16, btn_y - 10, w - 16, btn_y + 40), (11, 63, 191), (0, 183, 255))
            draw.text((w // 2, btn_y + 12), "تأكيد الطلب وتثبيت السعر ←", fill="#FFFFFF", font=font_body, anchor="mm")

    elif page == "order-detail":
        draw_top_bar(draw, w, "تفاصيل الطلب", mode, show_back=True)
        cy = 66
        # Dark card price lock
        draw_linear_gradient(img, (16, cy, w - 16, cy + 140), (6, 26, 85), (11, 63, 191))
        draw.text((w - 30, cy + 18), "السعر مثبت لمدة: 03:59:42", fill="#00B7FF", font=font_title, anchor="ra")
        draw.text((w - 30, cy + 50), "المبلغ المطلوب تحويله:", fill="#C9D6F5", font=font_body, anchor="ra")
        draw.text((w - 30, cy + 85), "472,875 SDG", fill="#FFFFFF", font=get_font(22), anchor="ra")
        draw.rounded_rectangle([w - 110, cy + 80, w - 30, cy + 115], radius=6, fill="#0B3FBF")
        draw.text((w - 70, cy + 94), "نسخ المبلغ", fill="#FFFFFF", font=font_caption, anchor="mm")

        cy += 155
        # Receipt upload card
        draw.rounded_rectangle([16, cy, w - 16, cy + 200], radius=16, fill="#FFFFFF", outline="#D5E2F7")
        draw.text((w - 30, cy + 20), "إشعار التحويل (بنكك)", fill="#061A55", font=font_title, anchor="ra")
        if mode == "before":
            draw.rectangle([28, cy + 50, 120, cy + 140], fill="#EAF3FF", outline="#D5E2F7")
            draw.text((74, cy + 90), "بدون معاينة", fill="#4B5B85", font=font_caption, anchor="mm")
        else:
            # Active receipt thumbnail with zoom overlay
            draw.rounded_rectangle([28, cy + 50, 128, cy + 150], radius=12, fill="#EAF3FF", outline="#0B3FBF")
            draw.text((78, cy + 90), "إشعار مرفوع ✓\nانقر للمعاينة", fill="#0B3FBF", font=font_caption, anchor="mm")
            # Preview modal preview box
            draw.rounded_rectangle([140, cy + 50, w - 28, cy + 150], radius=10, fill="#F4F8FE")
            draw.text((w - 40, cy + 70), "تم إرسال الإشعار بنجاح", fill="#12805C", font=font_caption, anchor="ra")
            draw.text((w - 40, cy + 100), "قيد المراجعة بواسطة الإدارة", fill="#4B5B85", font=font_caption, anchor="ra")

    elif page == "store":
        draw_top_bar(draw, w, "المتجر", mode, show_back=False)
        cy = 66
        # Quick filter chips
        chips = ["الكل", "حواسيب", "هواتف", "ملحقات", "جديد", "مستعمل"]
        cx = w - 16
        for c in chips:
            cw = len(c) * 12 + 16
            draw.rounded_rectangle([cx - cw, cy, cx, cy + 32], radius=999, fill="#FFFFFF", outline="#0B3FBF" if c=="الكل" else "#D5E2F7")
            draw.text((cx - cw//2, cy + 14), c, fill="#0B3FBF" if c=="الكل" else "#4B5B85", font=font_caption, anchor="mm")
            cx -= (cw + 8)

        cy += 44
        # Grid of cards
        for row in range(2):
            for col in range(2):
                gx0 = 16 + col * ((w - 36) // 2)
                gx1 = gx0 + ((w - 36) // 2)
                gy0 = cy + row * 180
                gy1 = gy0 + 170
                draw.rounded_rectangle([gx0, gy0, gx1, gy1], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
                draw.rectangle([gx0 + 8, gy0 + 8, gx1 - 8, gy0 + 90], fill="#F4F8FE")
                draw.text(((gx0+gx1)//2, gy0 + 105), f"جهاز {row*2+col+1}", fill="#061A55", font=font_caption, anchor="mm")
                draw.text(((gx0+gx1)//2, gy0 + 125), "380,000 SDG", fill="#0B3FBF", font=font_caption, anchor="mm")
                draw.rounded_rectangle([gx0 + 10, gy0 + 140, gx1 - 10, gy0 + 162], radius=6, fill="#0B3FBF" if mode=="before" else "#1E6BFF")
                draw.text(((gx0+gx1)//2, gy0 + 148), "إضافة للسلة", fill="#FFFFFF", font=get_font(9), anchor="mm")

        draw_bottom_tab_bar(draw, w, h, active_tab="store", mode=mode)

    elif page == "product-detail":
        draw_top_bar(draw, w, "تفاصيل الجهاز", mode, show_back=True)
        cy = 66
        # Image showcase
        draw.rounded_rectangle([16, cy, w - 16, cy + 180], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        draw.rectangle([28, cy + 12, w - 28, cy + 168], fill="#F4F8FE")
        draw.text((w // 2, cy + 90), "[صورة الجهاز بدقة عالية]", fill="#4B5B85", font=font_body, anchor="mm")

        cy += 190
        # Title and price
        draw.text((w - 20, cy), "ThinkPad T480s — Core i7", fill="#061A55", font=font_title, anchor="ra")
        draw.text((w - 20, cy + 28), "520,000 SDG", fill="#0B3FBF", font=get_font(20), anchor="ra")

        cy += 60
        # Tabs card
        draw.rounded_rectangle([16, cy, w - 16, cy + 140], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        draw.rectangle([20, cy + 6, w - 20, cy + 42], fill="#EAF3FF")
        draw.text((w - 60, cy + 20), "المواصفات", fill="#0B3FBF", font=font_body, anchor="ra")
        draw.text((w - 180, cy + 20), "الحالة والمحتويات", fill="#4B5B85", font=font_body, anchor="ra")
        draw.text((w - 30, cy + 60), "• المعالج: Intel Core i7 8th Gen", fill="#061A55", font=font_caption, anchor="ra")
        draw.text((w - 30, cy + 85), "• الذاكرة العشوائية: 16GB DDR4", fill="#061A55", font=font_caption, anchor="ra")
        draw.text((w - 30, cy + 110), "• التخزين: 512GB NVMe SSD", fill="#061A55", font=font_caption, anchor="ra")

        # Purchase bar
        pbar_y = h - 64
        if mode == "before":
            draw.rectangle([0, pbar_y, w, h], fill="#FFFFFF", outline="#D5E2F7")
            draw.rectangle([16, pbar_y + 8, w - 16, pbar_y + 48], fill="#0B3FBF")
            draw.text((w // 2, pbar_y + 24), "إضافة للسلة — 520,000 SDG", fill="#FFFFFF", font=font_body, anchor="mm")
        else:
            draw.rounded_rectangle([16, pbar_y - 10, w - 16, pbar_y + 44], radius=16, fill="#FFFFFF", outline="#D5E2F7")
            draw_linear_gradient(img, (24, pbar_y - 2, w - 24, pbar_y + 36), (11, 63, 191), (0, 183, 255))
            draw.text((w // 2, pbar_y + 14), "إضافة إلى السلة — 520,000 SDG", fill="#FFFFFF", font=font_body, anchor="mm")

    elif page == "orders":
        draw_top_bar(draw, w, "طلباتي", mode, show_back=False)
        cy = 66
        for idx in range(3):
            oy0 = cy + idx * 130
            oy1 = oy0 + 118
            draw.rounded_rectangle([16, oy0, w - 16, oy1], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
            draw.text((w - 30, oy0 + 18), f"طلب رقم #WEX-10{idx+1}", fill="#061A55", font=font_title, anchor="ra")
            # status chip
            st_color = "#12805C" if idx == 0 else ("#B45309" if idx == 1 else "#0B3FBF")
            st_text = "مكتمل" if idx == 0 else ("بانتظار التحويل" if idx == 1 else "قيد المراجعة")
            draw.rounded_rectangle([w - 120, oy0 + 44, w - 30, oy0 + 68], radius=999, fill="#F4F8FE", outline=st_color)
            draw.text((w - 75, oy0 + 54), st_text, fill=st_color, font=font_caption, anchor="mm")
            draw.text((w - 30, oy0 + 86), "الإجمالي: 487,500 SDG", fill="#061A55", font=font_body, anchor="ra")
        draw_bottom_tab_bar(draw, w, h, active_tab="account", mode=mode)

    elif page == "favorites":
        draw_top_bar(draw, w, "المفضلة", mode, show_back=False)
        cy = 66
        if mode == "after":
            # Add all to cart button
            draw_linear_gradient(img, (16, cy, w - 16, cy + 42), (11, 63, 191), (30, 107, 255))
            draw.text((w // 2, cy + 18), "إضافة جميع الأجهزة للسلة", fill="#FFFFFF", font=font_body, anchor="mm")
            cy += 54
        # compact item cards
        for f_idx in range(2):
            fy0 = cy + f_idx * 110
            fy1 = fy0 + 96
            draw.rounded_rectangle([16, fy0, w - 16, fy1], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
            draw.rounded_rectangle([w - 86, fy0 + 10, w - 24, fy0 + 86], radius=10, fill="#F4F8FE")
            draw.text((w - 100, fy0 + 20), f"جهاز مفضل {f_idx+1}", fill="#061A55", font=font_body, anchor="ra")
            draw.text((w - 100, fy0 + 46), "420,000 SDG", fill="#0B3FBF", font=font_body, anchor="ra")
        draw_bottom_tab_bar(draw, w, h, active_tab="favorites", mode=mode)

    elif page == "compare":
        draw_top_bar(draw, w, "مقارنة الأجهزة", mode, show_back=True)
        cy = 66
        # Sticky column table representation
        draw.rounded_rectangle([16, cy, w - 16, cy + 280], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        attrs = ["الجهاز", "السعر", "المعالج", "الرام", "التخزين"]
        for a_idx, attr in enumerate(attrs):
            ay = cy + a_idx * 52
            draw.line([(16, ay + 50), (w - 16, ay + 50)], fill="#D5E2F7", width=1)
            # Sticky attribute label (start)
            draw.rectangle([w - 90, ay, w - 16, ay + 50], fill="#EAF3FF" if mode=="after" else "#FFFFFF")
            draw.text((w - 53, ay + 20), attr, fill="#061A55", font=font_caption, anchor="mm")
            # device 1
            draw.text((w - 150, ay + 20), "جهاز أ", fill="#4B5B85", font=font_caption, anchor="mm")
            # device 2
            draw.text((w - 230, ay + 20), "جهاز ب", fill="#4B5B85", font=font_caption, anchor="mm")

    elif page == "account":
        draw_top_bar(draw, w, "حسابي", mode, show_back=False)
        cy = 66
        # Profile Card
        draw.rounded_rectangle([16, cy, w - 16, cy + 100], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        draw.ellipse([w - 76, cy + 20, w - 26, cy + 70], fill="#0B3FBF")
        draw.text((w - 51, cy + 40), "ع", fill="#FFFFFF", font=font_title, anchor="mm")
        draw.text((w - 90, cy + 30), "عميل ويكس", fill="#061A55", font=font_title, anchor="ra")
        draw.text((w - 90, cy + 55), "+249 91 234 5678", fill="#4B5B85", font=font_body, anchor="ra")

        cy += 116
        # Quick links
        links = ["طلباتي السابقة", "عناوين الاستلام", "تواصل عبر واتساب", "تسجيل الخروج"]
        for l_idx, link in enumerate(links):
            ly0 = cy + l_idx * 56
            draw.rounded_rectangle([16, ly0, w - 16, ly0 + 46], radius=12, fill="#FFFFFF", outline="#D5E2F7")
            link_col = "#B42318" if l_idx == 3 else ("#12805C" if l_idx == 2 else "#061A55")
            draw.text((w - 30, ly0 + 16), link, fill=link_col, font=font_body, anchor="ra")
            draw.text((30, ly0 + 16), "←", fill="#4B5B85", font=font_body, anchor="la")
        draw_bottom_tab_bar(draw, w, h, active_tab="account", mode=mode)

    elif page == "notifications":
        draw_top_bar(draw, w, "الإشعارات", mode, show_back=True)
        cy = 66
        # Notifications list
        notifs = [("تم تثبيت السعر لطلبك", "منذ 10 دقائق", True), ("تحديث جديد في قائمة الأجهزة", "أمس", False)]
        for n_idx, (ntitle, ntime, is_unread) in enumerate(notifs):
            ny0 = cy + n_idx * 86
            draw.rounded_rectangle([16, ny0, w - 16, ny0 + 74], radius=card_rad, fill="#FFFFFF" if not is_unread else "#F4F8FE", outline="#0B3FBF" if is_unread else "#D5E2F7")
            if is_unread:
                draw.ellipse([w - 28, ny0 + 20, w - 20, ny0 + 28], fill="#00B7FF")
            draw.text((w - 36, ny0 + 18), ntitle, fill="#061A55", font=font_body, anchor="ra")
            draw.text((w - 36, ny0 + 44), ntime, fill="#4B5B85", font=font_caption, anchor="ra")

    elif page == "faq":
        draw_top_bar(draw, w, "الأسئلة الشائعة", mode, show_back=True)
        cy = 66
        qas = ["كيف يعمل تثبيت السعر؟", "ما هي طرق الدفع المتاحة؟", "أين يقع مقر استلام الأجهزة؟", "هل الأجهزة مستوردة وجديدة؟"]
        for q_idx, q in enumerate(qas):
            qy0 = cy + q_idx * 64
            draw.rounded_rectangle([16, qy0, w - 16, qy0 + 52], radius=12, fill="#FFFFFF", outline="#D5E2F7")
            draw.text((w - 30, qy0 + 18), q, fill="#061A55", font=font_body, anchor="ra")
            draw.text((30, qy0 + 18), "▼" if q_idx == 0 else "◀", fill="#0B3FBF", font=font_caption, anchor="la")

    elif page == "login":
        draw_top_bar(draw, w, "تسجيل الدخول", mode, show_back=True)
        cy = 100
        # Logo / title
        draw.text((w // 2, cy), "مرحبًا بك في ويكس", fill="#061A55", font=get_font(22), anchor="mm")
        draw.text((w // 2, cy + 30), "سجّل برقم هاتفك لمتابعة طلباتك", fill="#4B5B85", font=font_body, anchor="mm")

        cy += 80
        draw.rounded_rectangle([16, cy, w - 16, cy + 220], radius=card_rad, fill="#FFFFFF", outline="#D5E2F7")
        draw.text((w - 30, cy + 24), "رقم الهاتف", fill="#061A55", font=font_body, anchor="ra")
        draw.rectangle([28, cy + 50, w - 28, cy + 96], fill="#F4F8FE", outline="#D5E2F7")
        draw.text((w - 40, cy + 68), "0912345678", fill="#061A55", font=font_body, anchor="ra")

        # Submit button
        if mode == "before":
            draw.rounded_rectangle([28, cy + 115, w - 28, cy + 160], radius=8, fill="#0B3FBF")
            draw.text((w // 2, cy + 134), "إرسال رمز التحقق", fill="#FFFFFF", font=font_body, anchor="mm")
        else:
            draw_linear_gradient(img, (28, cy + 115, w - 28, cy + 160), (11, 63, 191), (0, 183, 255))
            draw.text((w // 2, cy + 134), "إرسال رمز التحقق (OTP) ←", fill="#FFFFFF", font=font_body, anchor="mm")

        # Google button in Arabic
        g_label = "تسجيل الدخول عبر Google" if mode == "after" else "Sign in with Google"
        draw.rounded_rectangle([28, cy + 170, w - 28, cy + 208], radius=8, fill="#FFFFFF", outline="#D5E2F7")
        draw.text((w // 2, cy + 186), g_label, fill="#061A55", font=font_caption, anchor="mm")

    return img

def main():
    target_mode = sys.argv[1] if len(sys.argv) > 1 else "before"
    out_dir = f"docs/screens/{target_mode}"
    os.makedirs(out_dir, exist_ok=True)

    for page in PAGES:
        for vp_name, w, h in VIEWPORTS:
            img = render_screen(page, target_mode, vp_name, w, h)
            filename = f"{page}-{vp_name}.png"
            path = os.path.join(out_dir, filename)
            img.save(path, "PNG")
            print(f"Saved: {path}")

if __name__ == "__main__":
    main()
