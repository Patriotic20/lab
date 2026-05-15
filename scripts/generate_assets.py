"""Generate decorative images (gradients, icons) for the presentation."""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / "scripts" / "_assets"
ASSETS.mkdir(parents=True, exist_ok=True)

BRAND = (36, 44, 187)
BRAND_DARK = (20, 25, 110)
BRAND_LIGHT = (90, 100, 230)
ACCENT = (249, 115, 22)
WHITE = (255, 255, 255)
SOFT = (245, 247, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_bg(name, size, c1, c2, *, diagonal=False):
    """Linear gradient background."""
    w, h = size
    img = Image.new("RGB", size, c1)
    px = img.load()
    if diagonal:
        diag = math.hypot(w, h)
        for y in range(h):
            for x in range(w):
                t = (x + y) / (w + h)
                px[x, y] = lerp(c1, c2, t)
    else:
        for y in range(h):
            t = y / max(h - 1, 1)
            row = lerp(c1, c2, t)
            for x in range(w):
                px[x, y] = row
    out = ASSETS / f"{name}.png"
    img.save(out, "PNG", optimize=True)
    return out


def title_hero():
    """Hero image for title slide: brand gradient with abstract orbs."""
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), BRAND_DARK)
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        row = lerp(BRAND_DARK, BRAND, t)
        for x in range(w):
            px[x, y] = row

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    # Soft glowing orbs
    orbs = [
        (1450, 250, 380, (90, 110, 240, 90)),
        (1700, 850, 280, (255, 140, 50, 70)),
        (300, 900, 320, (140, 160, 255, 60)),
        (1200, 600, 200, (255, 180, 100, 50)),
    ]
    for cx, cy, r, color in orbs:
        od.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    overlay = overlay.filter(ImageFilter.GaussianBlur(80))

    img = Image.alpha_composite(img.convert("RGBA"), overlay)

    # Geometric grid pattern (subtle)
    od2 = ImageDraw.Draw(img)
    for i in range(0, w, 120):
        od2.line([(i, 0), (i, h)], fill=(255, 255, 255, 12), width=1)
    for i in range(0, h, 120):
        od2.line([(0, i), (w, i)], fill=(255, 255, 255, 12), width=1)

    out = ASSETS / "hero_title.png"
    img.convert("RGB").save(out, "PNG", optimize=True)
    return out


def content_bg():
    """Subtle background for content slides — white with brand accent corner."""
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), WHITE)
    d = ImageDraw.Draw(img)

    # Top-right decorative arc / circles
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((w - 250, -250, w + 250, 250), fill=(36, 44, 187, 18))
    od.ellipse((w - 180, -180, w + 180, 180), fill=(36, 44, 187, 28))
    od.ellipse((w - 100, -100, w + 100, 100), fill=(249, 115, 22, 35))
    overlay = overlay.filter(ImageFilter.GaussianBlur(2))

    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # Bottom-left subtle accent
    overlay2 = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od2 = ImageDraw.Draw(overlay2)
    od2.ellipse((-200, h - 200, 200, h + 200), fill=(36, 44, 187, 12))
    overlay2 = overlay2.filter(ImageFilter.GaussianBlur(4))
    img = Image.alpha_composite(img.convert("RGBA"), overlay2).convert("RGB")

    out = ASSETS / "content_bg.png"
    img.save(out, "PNG", optimize=True)
    return out


def section_bg():
    """Section divider — radial brand gradient."""
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), BRAND)
    px = img.load()
    cx, cy = w * 0.7, h * 0.4
    max_d = math.hypot(w, h)
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) / max_d
            t = min(1.0, d * 1.4)
            px[x, y] = lerp(BRAND_LIGHT, BRAND_DARK, t)

    # Add a few orbs
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((-150, h - 300, 400, h + 200), fill=(255, 255, 255, 30))
    od.ellipse((w - 400, -200, w + 100, 300), fill=(249, 115, 22, 60))
    overlay = overlay.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    out = ASSETS / "section_bg.png"
    img.save(out, "PNG", optimize=True)
    return out


def draw_icon_base(size=512):
    """White rounded square background for icons."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = 20
    d.rounded_rectangle(
        (pad, pad, size - pad, size - pad),
        radius=80, fill=(255, 255, 255, 255),
        outline=BRAND + (60,), width=3,
    )
    # Soft shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (pad + 4, pad + 8, size - pad + 4, size - pad + 8),
        radius=80, fill=(36, 44, 187, 30),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    return Image.alpha_composite(shadow, img)


def icon_problem():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    cx, cy = 256, 256
    # Warning triangle
    d.polygon([(cx, 130), (130, 380), (382, 380)], fill=ACCENT, outline=BRAND_DARK, width=4)
    d.rectangle((cx - 12, 210, cx + 12, 310), fill=WHITE)
    d.ellipse((cx - 14, 330, cx + 14, 358), fill=WHITE)
    out = ASSETS / "icon_problem.png"
    img.save(out, "PNG")
    return out


def icon_solution():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Lightbulb shape
    d.ellipse((150, 110, 362, 322), fill=ACCENT)
    d.rectangle((210, 290, 302, 360), fill=ACCENT)
    d.rectangle((220, 365, 292, 380), fill=BRAND_DARK)
    d.rectangle((230, 385, 282, 400), fill=BRAND_DARK)
    # Rays
    for ang in range(0, 360, 45):
        rad = math.radians(ang)
        x1 = 256 + math.cos(rad) * 130
        y1 = 216 + math.sin(rad) * 130
        x2 = 256 + math.cos(rad) * 175
        y2 = 216 + math.sin(rad) * 175
        d.line([(x1, y1), (x2, y2)], fill=BRAND, width=8)
    out = ASSETS / "icon_solution.png"
    img.save(out, "PNG")
    return out


def icon_platform():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Monitor
    d.rounded_rectangle((100, 130, 412, 340), radius=12, fill=BRAND)
    d.rounded_rectangle((115, 145, 397, 320), radius=6, fill=WHITE)
    d.rectangle((220, 340, 292, 380), fill=BRAND_DARK)
    d.rounded_rectangle((170, 375, 342, 400), radius=8, fill=BRAND_DARK)
    # Screen content
    d.rectangle((140, 170, 280, 185), fill=BRAND_LIGHT)
    d.rectangle((140, 200, 360, 215), fill=(200, 205, 230))
    d.rectangle((140, 225, 320, 240), fill=(200, 205, 230))
    d.rectangle((140, 255, 220, 295), fill=ACCENT)
    d.rectangle((230, 255, 360, 295), fill=BRAND_LIGHT)
    out = ASSETS / "icon_platform.png"
    img.save(out, "PNG")
    return out


def icon_users():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # 3 user silhouettes
    for i, (cx, scale, color) in enumerate([
        (180, 0.85, BRAND_LIGHT),
        (332, 0.85, BRAND_LIGHT),
        (256, 1.0, BRAND),
    ]):
        head_r = int(40 * scale)
        d.ellipse((cx - head_r, 180 - head_r, cx + head_r, 180 + head_r), fill=color)
        body_w = int(70 * scale)
        body_h = int(80 * scale)
        d.rounded_rectangle(
            (cx - body_w, 230, cx + body_w, 230 + body_h),
            radius=int(30 * scale), fill=color,
        )
    out = ASSETS / "icon_users.png"
    img.save(out, "PNG")
    return out


def icon_modules():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Grid of squares
    positions = [
        (130, 130, BRAND),
        (256, 130, BRAND_LIGHT),
        (382, 130, ACCENT),
        (130, 256, BRAND_LIGHT),
        (256, 256, ACCENT),
        (382, 256, BRAND),
        (130, 382, ACCENT),
        (256, 382, BRAND),
        (382, 382, BRAND_LIGHT),
    ]
    for cx, cy, color in positions:
        d.rounded_rectangle((cx - 45, cy - 45, cx + 45, cy + 45), radius=10, fill=color)
    out = ASSETS / "icon_modules.png"
    img.save(out, "PNG")
    return out


def icon_quiz():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Clipboard
    d.rounded_rectangle((140, 130, 372, 410), radius=12, fill=BRAND)
    d.rounded_rectangle((155, 145, 357, 395), radius=8, fill=WHITE)
    d.rounded_rectangle((220, 110, 292, 150), radius=8, fill=BRAND_DARK)
    # Checkboxes
    for i, y in enumerate([200, 260, 320]):
        d.rounded_rectangle((180, y, 220, y + 30), radius=5, outline=BRAND, width=3)
        if i < 2:
            d.line([(187, y + 15), (200, y + 25), (215, y + 8)], fill=ACCENT, width=5)
        d.rectangle((240, y + 8, 340, y + 22), fill=(210, 215, 235))
    out = ASSETS / "icon_quiz.png"
    img.save(out, "PNG")
    return out


def icon_face():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Face outline
    d.ellipse((156, 140, 356, 380), outline=BRAND, width=8)
    # Eyes
    d.ellipse((200, 220, 230, 250), fill=BRAND)
    d.ellipse((282, 220, 312, 250), fill=BRAND)
    # Mouth
    d.arc((216, 280, 296, 340), start=0, end=180, fill=BRAND, width=6)
    # Detection frame corners
    corner = 30
    for cx, cy in [(120, 120), (392, 120), (120, 392), (392, 392)]:
        if cx < 256 and cy < 256:
            d.line([(cx, cy), (cx + corner, cy)], fill=ACCENT, width=8)
            d.line([(cx, cy), (cx, cy + corner)], fill=ACCENT, width=8)
        elif cx > 256 and cy < 256:
            d.line([(cx, cy), (cx - corner, cy)], fill=ACCENT, width=8)
            d.line([(cx, cy), (cx, cy + corner)], fill=ACCENT, width=8)
        elif cx < 256 and cy > 256:
            d.line([(cx, cy), (cx + corner, cy)], fill=ACCENT, width=8)
            d.line([(cx, cy), (cx, cy - corner)], fill=ACCENT, width=8)
        else:
            d.line([(cx, cy), (cx - corner, cy)], fill=ACCENT, width=8)
            d.line([(cx, cy), (cx, cy - corner)], fill=ACCENT, width=8)
    out = ASSETS / "icon_face.png"
    img.save(out, "PNG")
    return out


def icon_psychology():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Brain hemispheres
    d.ellipse((130, 170, 270, 340), fill=BRAND_LIGHT)
    d.ellipse((242, 170, 382, 340), fill=BRAND)
    d.line([(256, 170), (256, 340)], fill=WHITE, width=4)
    # Heart on top
    d.polygon([
        (256, 410), (190, 360), (190, 330), (215, 310),
        (256, 335), (297, 310), (322, 330), (322, 360),
    ], fill=ACCENT)
    out = ASSETS / "icon_psychology.png"
    img.save(out, "PNG")
    return out


def icon_org():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Org chart
    boxes = [
        (256, 140, BRAND_DARK),
        (160, 260, BRAND),
        (256, 260, BRAND),
        (352, 260, BRAND),
        (160, 380, ACCENT),
        (256, 380, ACCENT),
        (352, 380, ACCENT),
    ]
    # Lines
    d.line([(256, 175), (256, 215)], fill=BRAND, width=4)
    d.line([(160, 230), (352, 230)], fill=BRAND, width=4)
    d.line([(160, 230), (160, 245)], fill=BRAND, width=4)
    d.line([(352, 230), (352, 245)], fill=BRAND, width=4)
    d.line([(160, 295), (160, 365)], fill=BRAND, width=4)
    d.line([(256, 295), (256, 365)], fill=BRAND, width=4)
    d.line([(352, 295), (352, 365)], fill=BRAND, width=4)
    for cx, cy, color in boxes:
        d.rounded_rectangle((cx - 40, cy - 25, cx + 40, cy + 25), radius=8, fill=color)
    out = ASSETS / "icon_org.png"
    img.save(out, "PNG")
    return out


def icon_content():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Stack of books
    d.rounded_rectangle((140, 320, 372, 380), radius=6, fill=BRAND)
    d.rounded_rectangle((160, 260, 392, 320), radius=6, fill=BRAND_LIGHT)
    d.rounded_rectangle((130, 200, 362, 260), radius=6, fill=ACCENT)
    # Lines on top book
    d.rectangle((160, 215, 280, 222), fill=WHITE)
    d.rectangle((160, 232, 320, 239), fill=WHITE)
    d.rectangle((160, 248, 250, 255), fill=WHITE)
    out = ASSETS / "icon_content.png"
    img.save(out, "PNG")
    return out


def icon_hemis():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Database / sync
    # Left cylinder
    d.ellipse((110, 160, 230, 200), fill=BRAND)
    d.rectangle((110, 180, 230, 340), fill=BRAND)
    d.ellipse((110, 320, 230, 360), fill=BRAND)
    d.ellipse((110, 160, 230, 200), outline=BRAND_DARK, width=3)
    # Right cylinder
    d.ellipse((282, 160, 402, 200), fill=BRAND_LIGHT)
    d.rectangle((282, 180, 402, 340), fill=BRAND_LIGHT)
    d.ellipse((282, 320, 402, 360), fill=BRAND_LIGHT)
    d.ellipse((282, 160, 402, 200), outline=BRAND_DARK, width=3)
    # Sync arrows
    d.polygon([(230, 240), (282, 230), (282, 250)], fill=ACCENT)
    d.polygon([(282, 280), (230, 270), (230, 290)], fill=ACCENT)
    out = ASSETS / "icon_hemis.png"
    img.save(out, "PNG")
    return out


def icon_stats():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Bar chart
    bars = [(150, 320, BRAND_LIGHT), (215, 260, BRAND), (280, 200, ACCENT), (345, 280, BRAND)]
    for x, y_top, color in bars:
        d.rounded_rectangle((x, y_top, x + 50, 400), radius=6, fill=color)
    # Axis
    d.line([(130, 400), (410, 400)], fill=BRAND_DARK, width=4)
    d.line([(130, 130), (130, 400)], fill=BRAND_DARK, width=4)
    out = ASSETS / "icon_stats.png"
    img.save(out, "PNG")
    return out


def icon_tech():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Stylized < / > code brackets
    d.polygon([(190, 200), (130, 256), (190, 312), (210, 296), (170, 256), (210, 216)], fill=BRAND)
    d.polygon([(322, 200), (382, 256), (322, 312), (302, 296), (342, 256), (302, 216)], fill=BRAND)
    # Slash
    d.line([(286, 180), (226, 332)], fill=ACCENT, width=10)
    out = ASSETS / "icon_tech.png"
    img.save(out, "PNG")
    return out


def icon_arch():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Stacked layers
    layers = [
        (130, 165, BRAND_DARK, "API"),
        (130, 230, BRAND, "WEB"),
        (130, 295, BRAND_LIGHT, "FACE"),
        (130, 360, ACCENT, "DB"),
    ]
    for x, y, color, _ in layers:
        d.rounded_rectangle((x, y, 382, y + 50), radius=8, fill=color)
        # connecting dots
    # Connector lines on sides
    for y in [215, 280, 345]:
        d.ellipse((130 - 8, y - 4, 130, y + 4), fill=BRAND_DARK)
        d.ellipse((382, y - 4, 382 + 8, y + 4), fill=BRAND_DARK)
    out = ASSETS / "icon_arch.png"
    img.save(out, "PNG")
    return out


def icon_security():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Shield
    pts = [
        (256, 130), (372, 175), (372, 280),
        (256, 400), (140, 280), (140, 175),
    ]
    d.polygon(pts, fill=BRAND)
    # Inner shield highlight
    pts2 = [
        (256, 160), (350, 195), (350, 275),
        (256, 370), (162, 275), (162, 195),
    ]
    d.polygon(pts2, fill=BRAND_LIGHT)
    # Lock
    d.rounded_rectangle((220, 260, 292, 330), radius=8, fill=WHITE)
    d.arc((220, 220, 292, 290), start=180, end=360, fill=WHITE, width=10)
    d.ellipse((248, 280, 264, 296), fill=BRAND)
    out = ASSETS / "icon_security.png"
    img.save(out, "PNG")
    return out


def icon_future():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Rocket
    d.polygon([(256, 130), (306, 250), (306, 340), (206, 340), (206, 250)], fill=BRAND)
    d.polygon([(256, 130), (276, 220), (236, 220)], fill=BRAND_LIGHT)
    d.ellipse((236, 250, 276, 290), fill=ACCENT)
    # Fins
    d.polygon([(206, 280), (170, 360), (206, 340)], fill=ACCENT)
    d.polygon([(306, 280), (342, 360), (306, 340)], fill=ACCENT)
    # Flame
    d.polygon([(230, 340), (256, 410), (282, 340)], fill=ACCENT)
    d.polygon([(244, 340), (256, 390), (268, 340)], fill=(255, 200, 100))
    # Stars
    for x, y in [(140, 150), (380, 180), (370, 320), (130, 350)]:
        d.regular_polygon((x, y, 12), n_sides=5, fill=BRAND_LIGHT)
    out = ASSETS / "icon_future.png"
    img.save(out, "PNG")
    return out


def icon_conclusion():
    img = draw_icon_base()
    d = ImageDraw.Draw(img)
    # Trophy
    d.rounded_rectangle((180, 150, 332, 280), radius=20, fill=ACCENT)
    # Handles
    d.arc((130, 160, 200, 260), start=90, end=270, fill=BRAND, width=12)
    d.arc((312, 160, 382, 260), start=270, end=90, fill=BRAND, width=12)
    # Stem
    d.rectangle((236, 280, 276, 340), fill=BRAND)
    # Base
    d.rounded_rectangle((180, 340, 332, 380), radius=8, fill=BRAND_DARK)
    # Star
    d.regular_polygon((256, 210, 30), n_sides=5, fill=WHITE)
    out = ASSETS / "icon_conclusion.png"
    img.save(out, "PNG")
    return out


def main():
    gradient_bg("brand_gradient", (1920, 1080), BRAND_DARK, BRAND, diagonal=True)
    title_hero()
    content_bg()
    section_bg()

    icon_problem()
    icon_solution()
    icon_platform()
    icon_users()
    icon_modules()
    icon_quiz()
    icon_face()
    icon_psychology()
    icon_org()
    icon_content()
    icon_hemis()
    icon_stats()
    icon_tech()
    icon_arch()
    icon_security()
    icon_future()
    icon_conclusion()

    print(f"Assets generated in: {ASSETS}")
    for p in sorted(ASSETS.glob("*.png")):
        print(f"  {p.name}")


if __name__ == "__main__":
    main()
