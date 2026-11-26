"""Renders the snapshot fixtures' product images (no text, no claims).

Real shops upload photos of a device centred on a light background. The seed images
from wex-api are text wireframes, which made card/gallery design impossible to judge in
CI screenshots. These are simple studio-style renders in that spirit.

    python3 -I scripts/ci/fixtures/render-product-images.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
W, H, S = 800, 600, 2  # 4:3, drawn at 2x then downsampled


def canvas():
    im = Image.new('RGB', (W * S, H * S), (246, 248, 251))
    glow = Image.new('L', (W * S, H * S), 0)
    ImageDraw.Draw(glow).ellipse((W * S * 0.1, H * S * 0.05, W * S * 0.9, H * S * 0.95), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    im.paste(Image.new('RGB', im.size, (255, 255, 255)), (0, 0), glow)
    return im


def shadow(im, box, blur=28, alpha=70):
    sh = Image.new('L', im.size, 0)
    ImageDraw.Draw(sh).ellipse(box, fill=alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(blur * S))
    im.paste(Image.new('RGB', im.size, (40, 48, 70)), (0, 0), sh)


def laptop(body, screen_tint):
    im = canvas()
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    shadow(im, (cx - 300 * S, 455 * S, cx + 300 * S, 500 * S))
    # lid
    lid = (cx - 235 * S, 110 * S, cx + 235 * S, 410 * S)
    d.rounded_rectangle(lid, radius=16 * S, fill=body)
    d.rounded_rectangle((lid[0] + 14 * S, lid[1] + 14 * S, lid[2] - 14 * S, lid[3] - 10 * S), radius=6 * S, fill=(18, 22, 34))
    # screen content: soft gradient + diagonal reflection
    scr = (lid[0] + 22 * S, lid[1] + 22 * S, lid[2] - 22 * S, lid[3] - 18 * S)
    g = Image.new('RGB', (scr[2] - scr[0], scr[3] - scr[1]))
    gd = ImageDraw.Draw(g)
    for y in range(g.height):
        t = y / g.height
        gd.line((0, y, g.width, y), fill=tuple(int(screen_tint[i] * (1 - t) + (10, 20, 50)[i] * t) for i in range(3)))
    refl = Image.new('L', g.size, 0)
    ImageDraw.Draw(refl).polygon([(g.width * 0.55, 0), (g.width * 0.75, 0), (g.width * 0.35, g.height), (g.width * 0.15, g.height)], fill=38)
    g.paste(Image.new('RGB', g.size, (255, 255, 255)), (0, 0), refl)
    im.paste(g, scr[:2])
    d.ellipse((cx - 3 * S, lid[1] + 6 * S, cx + 3 * S, lid[1] + 12 * S), fill=(60, 64, 72))
    # base (perspective trapezoid) + front lip
    top, bot = 410 * S, 452 * S
    d.polygon([(lid[0] - 20 * S, top), (lid[2] + 20 * S, top), (lid[2] + 58 * S, bot), (lid[0] - 58 * S, bot)], fill=tuple(max(0, c - 10) for c in body))
    d.rounded_rectangle((lid[0] - 58 * S, bot - 4 * S, lid[2] + 58 * S, bot + 10 * S), radius=6 * S, fill=tuple(max(0, c - 28) for c in body))
    d.rounded_rectangle((cx - 50 * S, bot - 2 * S, cx + 50 * S, bot + 4 * S), radius=3 * S, fill=tuple(max(0, c - 45) for c in body))
    return im


def phone(body):
    im = canvas()
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    shadow(im, (cx - 140 * S, 500 * S, cx + 140 * S, 540 * S), alpha=60)
    d.rounded_rectangle((cx - 120 * S, 70 * S, cx + 120 * S, 520 * S), radius=38 * S, fill=body)
    d.rounded_rectangle((cx - 110 * S, 80 * S, cx + 110 * S, 510 * S), radius=30 * S, fill=(14, 20, 40))
    g = Image.new('L', (220 * S, 430 * S), 0)
    ImageDraw.Draw(g).polygon([(130 * S, 0), (200 * S, 0), (60 * S, 430 * S), (0, 430 * S)], fill=30)
    im.paste(Image.new('RGB', g.size, (255, 255, 255)), (cx - 110 * S, 80 * S), g)
    d.rounded_rectangle((cx - 30 * S, 92 * S, cx + 30 * S, 108 * S), radius=8 * S, fill=(0, 0, 0))
    return im


def mouse():
    im = canvas()
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    shadow(im, (cx - 130 * S, 440 * S, cx + 130 * S, 480 * S), alpha=70)
    d.ellipse((cx - 115 * S, 130 * S, cx + 115 * S, 470 * S), fill=(48, 52, 60))
    d.ellipse((cx - 100 * S, 140 * S, cx + 100 * S, 300 * S), fill=(62, 66, 76))
    d.line((cx, 140 * S, cx, 285 * S), fill=(30, 32, 38), width=3 * S)
    d.rounded_rectangle((cx - 9 * S, 180 * S, cx + 9 * S, 225 * S), radius=9 * S, fill=(28, 30, 36))
    return im


def backpack():
    im = canvas()
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    shadow(im, (cx - 190 * S, 500 * S, cx + 190 * S, 540 * S), alpha=70)
    d.rounded_rectangle((cx - 60 * S, 60 * S, cx + 60 * S, 120 * S), radius=30 * S, outline=(36, 44, 60), width=14 * S)
    d.rounded_rectangle((cx - 170 * S, 100 * S, cx + 170 * S, 520 * S), radius=70 * S, fill=(44, 54, 74))
    d.rounded_rectangle((cx - 120 * S, 300 * S, cx + 120 * S, 470 * S), radius=36 * S, fill=(56, 68, 92))
    d.line((cx - 100 * S, 330 * S, cx + 100 * S, 330 * S), fill=(32, 40, 56), width=4 * S)
    return im


def charger():
    im = canvas()
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    shadow(im, (cx - 210 * S, 420 * S, cx + 120 * S, 460 * S), alpha=60)
    d.line([(cx + 60 * S, 330 * S), (cx + 200 * S, 330 * S), (cx + 260 * S, 250 * S), (cx + 230 * S, 170 * S)], fill=(40, 42, 48), width=10 * S, joint='curve')
    d.rounded_rectangle((cx - 200 * S, 250 * S, cx + 70 * S, 420 * S), radius=24 * S, fill=(38, 40, 46))
    d.rounded_rectangle((cx - 185 * S, 262 * S, cx + 55 * S, 300 * S), radius=14 * S, fill=(52, 54, 62))
    d.ellipse((cx - 72 * S, 340 * S, cx - 60 * S, 352 * S), fill=(70, 200, 120))
    return im


def ssd():
    im = canvas()
    d = ImageDraw.Draw(im)
    cx = W * S // 2
    shadow(im, (cx - 200 * S, 400 * S, cx + 200 * S, 440 * S), alpha=60)
    d.rounded_rectangle((cx - 190 * S, 150 * S, cx + 190 * S, 410 * S), radius=14 * S, fill=(40, 44, 52))
    d.rounded_rectangle((cx - 170 * S, 170 * S, cx + 170 * S, 330 * S), radius=8 * S, fill=(200, 30, 45))
    d.rounded_rectangle((cx - 150 * S, 350 * S, cx + 40 * S, 380 * S), radius=4 * S, fill=(70, 74, 84))
    return im


def receipt():
    # A bank-transfer screenshot stand-in (portrait phone capture): bars, not text.
    w, h = 600 * S, 900 * S
    im = Image.new('RGB', (w, h), (238, 242, 248))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 110 * S), fill=(12, 74, 156))
    d.rounded_rectangle((40 * S, 150 * S, w - 40 * S, 820 * S), radius=24 * S, fill=(255, 255, 255))
    d.ellipse((w // 2 - 46 * S, 190 * S, w // 2 + 46 * S, 282 * S), fill=(34, 160, 90))
    d.line([(w // 2 - 22 * S, 236 * S), (w // 2 - 6 * S, 252 * S), (w // 2 + 24 * S, 218 * S)], fill=(255, 255, 255), width=10 * S)
    for i, (x0, ww) in enumerate([(160, 280), (200, 200), (120, 360), (120, 360), (120, 360), (120, 360), (200, 200)]):
        y = (330 + i * 64) * S
        d.rounded_rectangle((x0 * S, y, (x0 + ww) * S, y + 22 * S), radius=8 * S, fill=(214, 222, 234) if i else (40, 52, 80))
    return im


ITEMS = {
    'laptop-silver': lambda: laptop((198, 203, 211), (70, 120, 210)),
    'laptop-black': lambda: laptop((44, 47, 54), (40, 90, 190)),
    'laptop-gray': lambda: laptop((118, 124, 134), (90, 70, 190)),
    'laptop-navy': lambda: laptop((32, 44, 78), (20, 140, 200)),
    'phone-black': lambda: phone((30, 32, 38)),
    'mouse': mouse,
    'backpack': backpack,
    'charger': charger,
    'ssd': ssd,
}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    receipt().resize((600, 900), Image.LANCZOS).save(os.path.join(OUT, 'receipt.jpg'), quality=82, optimize=True)
    for name, fn in ITEMS.items():
        im = fn().resize((W, H), Image.LANCZOS)
        im.save(os.path.join(OUT, f'{name}.jpg'), quality=84, optimize=True, progressive=True)
        im.resize((400, 300), Image.LANCZOS).save(os.path.join(OUT, f'{name}_thumb.jpg'), quality=80, optimize=True)
    print('rendered', len(ITEMS))
