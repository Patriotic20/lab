"""Generate NDKTU Student Face Platform presentation in Uzbek (.pptx)."""
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

PRIMARY = RGBColor(0x1E, 0x40, 0xAF)
ACCENT = RGBColor(0xF9, 0x73, 0x16)
DARK = RGBColor(0x1F, 0x29, 0x37)
LIGHT = RGBColor(0xF3, 0xF4, 0xF6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0x6B, 0x72, 0x80)

FONT = "Calibri"

OUTPUT = Path(__file__).resolve().parent.parent / "NDKTU_Platforma_Taqdimot.pptx"


def add_background(slide, prs, color=WHITE):
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.line.fill.background()
    bg.shadow.inherit = False
    return bg


def add_side_bar(slide, prs, color=PRIMARY, width_in=0.35):
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(width_in), prs.slide_height
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    return bar


def add_textbox(slide, left, top, width, height, text, *,
                size=18, bold=False, color=DARK, align=PP_ALIGN.LEFT,
                font=FONT):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0)
    tf.margin_right = Inches(0)
    tf.margin_top = Inches(0)
    tf.margin_bottom = Inches(0)
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return tb


def add_bullets(slide, left, top, width, height, items, *,
                size=18, color=DARK, bullet_color=ACCENT):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0)
    tf.margin_right = Inches(0)
    tf.margin_top = Inches(0)
    tf.margin_bottom = Inches(0)
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(10)
        bullet = p.add_run()
        bullet.text = "▸  "
        bullet.font.name = FONT
        bullet.font.size = Pt(size)
        bullet.font.bold = True
        bullet.font.color.rgb = bullet_color
        run = p.add_run()
        run.text = item
        run.font.name = FONT
        run.font.size = Pt(size)
        run.font.color.rgb = color
    return tb


def add_footer(slide, prs, page_num, total):
    add_textbox(
        slide,
        Inches(0.5), prs.slide_height - Inches(0.4),
        Inches(6), Inches(0.3),
        "NDKTU Talabalar Yuz Aniqlash Platformasi",
        size=10, color=MUTED,
    )
    add_textbox(
        slide,
        prs.slide_width - Inches(1.5), prs.slide_height - Inches(0.4),
        Inches(1), Inches(0.3),
        f"{page_num} / {total}",
        size=10, color=MUTED, align=PP_ALIGN.RIGHT,
    )


def content_slide(prs, page_num, total, title, subtitle, bullets):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_background(slide, prs, WHITE)
    add_side_bar(slide, prs, PRIMARY)

    add_textbox(
        slide, Inches(0.7), Inches(0.5),
        Inches(12), Inches(0.7),
        title, size=32, bold=True, color=PRIMARY,
    )
    if subtitle:
        add_textbox(
            slide, Inches(0.7), Inches(1.2),
            Inches(12), Inches(0.5),
            subtitle, size=16, color=MUTED,
        )

    accent = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.7), Inches(1.75),
        Inches(1.5), Inches(0.05),
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = ACCENT
    accent.line.fill.background()

    add_bullets(
        slide,
        Inches(0.9), Inches(2.1),
        Inches(11.5), Inches(4.8),
        bullets, size=18, color=DARK,
    )

    add_footer(slide, prs, page_num, total)
    return slide


def title_slide(prs, total):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_background(slide, prs, PRIMARY)

    accent = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(1), Inches(2.0),
        Inches(1.2), Inches(0.08),
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = ACCENT
    accent.line.fill.background()

    add_textbox(
        slide, Inches(1), Inches(2.3),
        Inches(11), Inches(1.2),
        "NDKTU Talabalar Yuz",
        size=48, bold=True, color=WHITE,
    )
    add_textbox(
        slide, Inches(1), Inches(3.1),
        Inches(11), Inches(1.2),
        "Aniqlash Platformasi",
        size=48, bold=True, color=WHITE,
    )
    add_textbox(
        slide, Inches(1), Inches(4.3),
        Inches(11), Inches(0.6),
        "Onlayn imtihonlar uchun zamonaviy raqamli yechim",
        size=22, color=LIGHT,
    )

    add_textbox(
        slide, Inches(1), Inches(6.3),
        Inches(11), Inches(0.4),
        "Muallif: Bekzod Gulomov",
        size=14, color=LIGHT,
    )
    add_textbox(
        slide, Inches(1), Inches(6.7),
        Inches(11), Inches(0.4),
        "Sana: 15-may, 2026-yil",
        size=14, color=LIGHT,
    )
    return slide


def closing_slide(prs, page_num, total):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_background(slide, prs, PRIMARY)

    add_textbox(
        slide, Inches(1), Inches(2.5),
        Inches(11), Inches(1.5),
        "Rahmat!",
        size=72, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(1), Inches(3.8),
        Inches(11), Inches(0.6),
        "E'tiboringiz uchun tashakkur",
        size=24, color=LIGHT, align=PP_ALIGN.CENTER,
    )

    accent = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(5.5), Inches(4.7),
        Inches(2.5), Inches(0.06),
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = ACCENT
    accent.line.fill.background()

    add_textbox(
        slide, Inches(1), Inches(5.2),
        Inches(11), Inches(0.4),
        "Savollar va takliflar uchun:",
        size=16, color=LIGHT, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(1), Inches(5.7),
        Inches(11), Inches(0.4),
        "bgulomov000@gmail.com",
        size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
    )
    return slide


SLIDES = [
    {
        "title": "Muammo",
        "subtitle": "Hozirgi vaziyat va qiyinchiliklar",
        "bullets": [
            "An'anaviy onlayn testlarda nazorat tizimi yo'q — ko'chirib yozish keng tarqalgan",
            "Talaba va o'qituvchi ma'lumotlari turli tizimlarda qo'lda kiritiladi",
            "Imtihon natijalari bo'yicha chuqur tahlil va statistika yetishmaydi",
            "Talabalarning psixologik holatini baholash uchun yagona platforma yo'q",
            "HEMIS tizimi bilan integratsiya cheklangan, ma'lumotlar ikki marta kiritiladi",
        ],
    },
    {
        "title": "Yechim",
        "subtitle": "Bizning yondashuvimiz",
        "bullets": [
            "Yagona platforma: testlar, psixologik baholash, talabalar boshqaruvi",
            "Sun'iy intellekt asosida real vaqtda yuz aniqlash orqali nazorat",
            "HEMIS tizimi bilan to'liq integratsiya — ma'lumotlar avtomatik sinxronizatsiya",
            "8 ta yo'nalishda batafsil statistika va analitika paneli",
            "Bulutli arxitektura: Docker konteynerlarida xavfsiz va kengaytiriladigan",
        ],
    },
    {
        "title": "Platforma haqida",
        "subtitle": "Umumiy ko'rinish",
        "bullets": [
            "NDKTU uchun maxsus ishlab chiqilgan ta'lim platformasi",
            "5 ta foydalanuvchi roli: administrator, o'qituvchi, talaba, psixolog, tyutor",
            "12 dan ortiq bog'langan modul: testlar, darslar, resurslar, baholash",
            "Veb-brauzerda ishlaydi — qo'shimcha dastur o'rnatish shart emas",
            "O'zbek va ingliz tillarida foydalanuvchi interfeysi",
        ],
    },
    {
        "title": "Foydalanuvchilar va rollar",
        "subtitle": "Har bir rol — o'z imkoniyatlari",
        "bullets": [
            "Administrator: tizimni boshqarish, foydalanuvchilar, rollar va ruxsatlar",
            "O'qituvchi: testlar yaratish, darslarni boshqarish, natijalarni ko'rish",
            "Talaba: testlarda qatnashish, psixologik baholash, natijalarni ko'rish",
            "Psixolog: psixologik metodikalar yaratish, talabalar holatini kuzatish",
            "Tyutor: guruhlarni nazorat qilish, talabalarga akademik yordam",
        ],
    },
    {
        "title": "Asosiy modullar",
        "subtitle": "Platforma tarkibiy qismlari",
        "bullets": [
            "Test tizimi (Quiz) — PIN kod, taymer, avtomatik baholash",
            "Yuz aniqlash (Face Detection) — real vaqtda imtihon nazorati",
            "Psixologik baholash — standart metodikalar va avtomatik skoring",
            "HEMIS integratsiyasi — talaba va o'qituvchilar avtomatik import",
            "Statistika va tahlil — 8 ta bo'lim bo'yicha analitik panel",
            "Tashkiliy boshqaruv — fakultet, kafedra, guruh, o'quv yili",
        ],
    },
    {
        "title": "Test tizimi",
        "subtitle": "Onlayn imtihonlarni tashkil etish",
        "bullets": [
            "O'qituvchilar test yaratadi: bir nechta variantli, ha/yo'q, shkala, ochiq savol",
            "Talabalar PIN kod orqali testga kiradi — ruxsatsiz kirish to'sib qo'yilgan",
            "Real vaqt taymeri — vaqt tugashi bilan test avtomatik yopiladi",
            "Obyektiv savollar avtomatik baholanadi, natija darhol ko'rinadi",
            "Testni nusxalash, qayta o'tkazish va savol bankidan foydalanish imkoniyati",
        ],
    },
    {
        "title": "Yuz aniqlash (Face Detection)",
        "subtitle": "Sun'iy intellekt asosida nazorat",
        "bullets": [
            "WebSocket orqali brauzerdan jonli video oqim olinadi",
            "Google MediaPipe modeli har bir kadrda yuzlar sonini aniqlaydi",
            "Ikkita yuz aniqlanganda yoki shaxs o'zgarganda ogohlantirish beriladi",
            "3 ta ogohlantirishdan keyin test avtomatik tugatiladi",
            "Buzilishlar dalil sifatida rasm shaklida saqlanadi — keyinchalik tekshirish uchun",
        ],
    },
    {
        "title": "Psixologik baholash",
        "subtitle": "Talabalar ruhiy holatini kuzatish",
        "bullets": [
            "Psixologlar standart metodikalar yaratadi (Likert shkalasi, ha/yo'q, ko'p variantli)",
            "Talabalar onlayn rejimda psixologik testlarni topshiradi",
            "Tizim natijalarni avtomatik hisoblaydi va talqin qiladi",
            "Rasm orqali stimul beruvchi savollar qo'llab-quvvatlanadi",
            "Talabalar bo'yicha psixologik tarix saqlanadi va kuzatib boriladi",
        ],
    },
    {
        "title": "Tashkiliy boshqaruv",
        "subtitle": "Universitet strukturasini raqamlashtirish",
        "bullets": [
            "Fakultet → Kafedra → Guruh → Talaba — yagona ierarxiya",
            "O'quv yili va semestrlar bo'yicha rejalashtirish",
            "Sinflar (mashg'ulotlar) o'qituvchi, guruh va mavzu bilan bog'lanadi",
            "Davomat va talabalarning aktivligini kuzatish",
            "Excel orqali ommaviy import va eksport qilish imkoniyati",
        ],
    },
    {
        "title": "O'quv kontenti",
        "subtitle": "Darslar va resurslar",
        "bullets": [
            "Darslar: mavzu, tavsif, biriktirilgan o'qituvchi va guruh",
            "Resurslar: PDF, hujjat va rasm shaklidagi o'quv materiallari",
            "Syllabus: kurs dasturini elektron shaklda yuritish",
            "Yakuniy imtihonlar: oraliq testlardan alohida hisobga olinadi",
            "Mavzular bo'yicha boy matn muharriri (rasmlar, jadvallar bilan)",
        ],
    },
    {
        "title": "HEMIS integratsiyasi",
        "subtitle": "Rasmiy ta'lim tizimi bilan bog'lanish",
        "bullets": [
            "Administrator HEMIS login orqali bevosita ulanadi",
            "Talabalar, o'qituvchilar, fanlar va guruhlar avtomatik import qilinadi",
            "Sinxronlashdan oldin oldindan ko'rib chiqish (preview) imkoniyati",
            "Har bir sinxronlash tranzaksiyasi tarixda saqlanadi",
            "Qo'lda ma'lumot kiritish zaruriyati yo'qoladi — vaqt va xato kamayadi",
        ],
    },
    {
        "title": "Statistika va tahlil",
        "subtitle": "Ma'lumotlarga asoslangan qarorlar",
        "bullets": [
            "Umumiy statistika — tizim bo'yicha asosiy ko'rsatkichlar",
            "Test analitikasi — har bir test bo'yicha o'tish foizi va vaqt",
            "Savol tahlili (Item Analysis) — savol qiyinligi va sifati",
            "Demografiya — fakultet va guruhlar bo'yicha tahlil",
            "Nazorat statistikasi — buzilishlar sababi va miqyosi bo'yicha",
            "Psixologik, o'qituvchi faolligi va yakuniy imtihon statistikasi",
        ],
    },
    {
        "title": "Texnologiyalar",
        "subtitle": "Zamonaviy va ishonchli stek",
        "bullets": [
            "Backend: FastAPI (Python 3.12) — yuqori unumdor async API",
            "Frontend: React 19 + TypeScript + Tailwind CSS",
            "Ma'lumotlar bazasi: PostgreSQL 17 + Redis (keshlash)",
            "Yuz aniqlash: Google MediaPipe + OpenCV",
            "Autentifikatsiya: JWT tokenlari + bcrypt parollarni xeshlash",
            "Konteynerlash: Docker + Docker Compose",
        ],
    },
    {
        "title": "Arxitektura",
        "subtitle": "Mikroservislar yondashuvi",
        "bullets": [
            "Frontend (port 3000) — React SPA, Nginx orqali xizmat ko'rsatadi",
            "Backend API (port 8000) — asosiy biznes mantiq va REST API",
            "Face Detection xizmati (port 8001) — alohida mikroservis",
            "PostgreSQL + Redis — ma'lumotlar va kesh qatlami",
            "Health check va avtomatik qayta ishga tushirish mexanizmi",
            "Production-da Nginx reverse proxy orqali xavfsiz ulanish",
        ],
    },
    {
        "title": "Xavfsizlik",
        "subtitle": "Ma'lumotlar himoyasi va yaxlitligi",
        "bullets": [
            "JWT tokenlar va xavfsiz autentifikatsiya — sessiyalar himoyalangan",
            "Rollar va ruxsatlar (RBAC) — har bir amal nazorat ostida",
            "Rate limiting — brute-force va DDoS hujumlarga qarshi himoya",
            "XSS himoyasi — barcha HTML kontent DOMPurify orqali tozalanadi",
            "SQL injection himoyasi — SQLAlchemy parametrlangan so'rovlari",
            "Imtihon buzilishlari dalillari saqlanadi — to'liq audit izi",
        ],
    },
    {
        "title": "Kelajakdagi imkoniyatlar",
        "subtitle": "Rivojlanish yo'nalishlari",
        "bullets": [
            "Mobil ilova (iOS / Android) — talabalar uchun qulaylik",
            "Sun'iy intellekt yordamida savol generatsiyasi (AI)",
            "Moslashuvchi testlash (CAT) — daraja bo'yicha avtomatik moslashish",
            "Kengaytirilgan nazorat: ko'z harakati, klaviatura tahlili, brauzer ortida bo'lish",
            "LMS tizimlari bilan integratsiya (Moodle, Canvas, Blackboard)",
            "Prognozli analitika — muvaffaqiyatsiz bo'lishi mumkin bo'lgan talabalarni oldindan aniqlash",
        ],
    },
    {
        "title": "Xulosa",
        "subtitle": "Platforma universitetga nima beradi",
        "bullets": [
            "Imtihon jarayonini to'liq raqamlashtirish va shaffoflashtirish",
            "Ko'chirib yozish va firibgarliklarning keskin kamayishi (AI-nazorat)",
            "Ma'lumotlarni qo'lda kiritish vaqtining qisqarishi (HEMIS sinxronlash)",
            "O'qituvchilar va rahbariyat uchun chuqur analitika",
            "Talabalar psixologik holatini kuzatish va o'z vaqtida yordam berish",
            "Kelajakda kengaytirish uchun moslashuvchan zamonaviy arxitektura",
        ],
    },
]


def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    total = len(SLIDES) + 2

    title_slide(prs, total)

    for idx, data in enumerate(SLIDES, start=2):
        content_slide(
            prs, idx, total,
            data["title"], data["subtitle"], data["bullets"],
        )

    closing_slide(prs, total, total)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(OUTPUT)
    print(f"Saved: {OUTPUT}")
    print(f"Slides: {total}")


if __name__ == "__main__":
    main()
