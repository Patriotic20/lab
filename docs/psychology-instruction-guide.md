# Psixologik test «Ko'rsatma» (instruction) ni yozish bo'yicha qo'llanma

Bu qo'llanma psixolog yoki o'qituvchi uchun. Dasturlash bilmasangiz ham yetarli — faqat tartib bilan ish ko'ring.

---

## Tushuncha

Har bir psixologik metodda **ikki narsa kerak:**

1. **Skoring** — talabaning javoblari qanday ballga aylantiriladi
2. **Interpretatsiya** — yig'ilgan ball qanday natijaga (past / o'rta / yuqori) tarjima qilinadi

Bularning ikkalasi metodning **«Ko'rsatma»** maydoniga JSON ko'rinishida yoziladi.

> **JSON** — bu shunchaki ma'lumotlarni tartibli yozish uslubi: `{ kalit: qiymat }`. Quyidagi shablonlardan foydalansangiz qiyinchilik tug'ilmaydi.

---

## Ikki turdagi metod

### Tur 1 — **Sodda yig'indi** (`sum`)

Hamma savollardagi ballar **bitta umumiy yig'indi** ga qo'shiladi va jami ball asosida bitta diagnoz beriladi.

**Qachon ishlatish:** stress, depressiya, charchoq, motivatsiya — har qanday bitta xususiyatni o'lchovchi qisqa testlar.

### Tur 2 — **Kategoriyalar bo'yicha** (`category`)

Savollar guruhlarga bo'linadi (masalan: 1, 3, 5 — ekstraversiya; 2, 4, 6 — neyrotizm). Har bir guruh alohida hisoblanadi va alohida diagnoz oladi.

**Qachon ishlatish:** shaxsiyatning bir nechta jihatini bir testda o'lchash (Eysenck, MMPI, Big Five va h.k.).

---

## Shablon 1 — Sodda «sum» metod

```json
{
  "scoring": {
    "method": "sum",
    "reverse": []
  },
  "interpretation": [
    { "min": 0,  "max": 5,  "label": "Past",     "description": "Past darajadagi izoh" },
    { "min": 6,  "max": 12, "label": "O'rtacha", "description": "O'rta darajadagi izoh" },
    { "min": 13, "max": 20, "label": "Yuqori",   "description": "Yuqori darajadagi izoh" }
  ]
}
```

### Maydonlar nima qiladi?

| Maydon | Tushuntirish |
|---|---|
| `scoring.method` | Doim `"sum"` deb yozing |
| `scoring.reverse` | Teskari javobli savollar tartib raqamlari (quyida tushuntiraman) |
| `interpretation` | Ball oraliqlari va ularga mos diagnoz |
| `min` / `max` | Ball oralig'i (ikkalasi ham kiradi) |
| `label` | Qisqa nom — talaba katta shrift bilan ko'radi |
| `description` | Batafsil izoh — yorliq ostida chiqadi |

### Ball oraliqlarini qanday tanlash?

Maksimal ball = barcha savollarning eng yuqori javoblari yig'indisi.

**Misol:** 10 ta `Ha/Yo'q` savol → maksimal `10` ball
- Past:    0–3
- O'rta:   4–6
- Yuqori:  7–10

**Misol:** 5 ta savol, har biri 1–5 li shkala → maksimal `25` ball
- Past:    0–8
- O'rta:   9–17
- Yuqori:  18–25

> **Eslatma:** oraliqlar **ketma-ket** va **kesishmasligi** kerak. Aks holda diagnoz noto'g'ri chiqadi.

---

## Shablon 2 — Kategoriyalar bo'yicha metod

```json
{
  "scoring": {
    "method": "category",
    "reverse": [],
    "categories": {
      "ekstraversiya": [1, 3, 5, 7, 9],
      "neyrotizm":    [2, 4, 6, 8, 10]
    }
  },
  "category_interpretations": {
    "ekstraversiya": [
      { "min": 0, "max": 2, "label": "Introvert",  "description": "Yopiq xarakter" },
      { "min": 3, "max": 5, "label": "Ekstravert", "description": "Ochiq xarakter" }
    ],
    "neyrotizm": [
      { "min": 0, "max": 2, "label": "Barqaror",     "description": "..." },
      { "min": 3, "max": 5, "label": "Hissiyotchang", "description": "..." }
    ]
  }
}
```

### Qoidalar

- `scoring.categories` — bu obyekt: kalit = kategoriya nomi, qiymat = **shu kategoriya hisoblanishi kerak bo'lgan savollarning tartib raqamlari**
- `category_interpretations` — har bir kategoriya uchun ALOHIDA `interpretation` jadval

---

## «Reverse» — teskari savollarni tushunish

Ba'zi savollar **teskari** baholanadi. Masalan:

> «Men yaxshi uxlayman» — Ha → stress past (0), Yo'q → stress yuqori (1)

Bu — teskari savol. Bunday savollarni `scoring.reverse` ro'yxatiga qo'yiladi:

```json
"reverse": [3, 7]   // 3-savol va 7-savol teskari
```

Tizim avtomatik:
- `Ha/Yo'q` da: `Ha (1) ↔ Yo'q (0)`
- `Shkala` da: agar shkala 1–5 bo'lsa, `1↔5`, `2↔4`, `3↔3`

> **Muhim:** `reverse` ichidagi raqamlar — savolning **tartib raqami** (frontendda «Tartib raqami» maydoni), ID emas.

---

## Tayyor misollar — ko'chiring va ishlating

### Misol A — «Stress darajasi» (5 ta savol, sum)

```json
{
  "scoring": {
    "method": "sum",
    "reverse": [3]
  },
  "interpretation": [
    { "min": 0,  "max": 4,  "label": "Past stress",     "description": "Sizda stress darajasi past. Hayotingiz muvozanatda." },
    { "min": 5,  "max": 9,  "label": "O'rtacha stress", "description": "Stress o'rtacha. Dam olish va sportga e'tibor bering." },
    { "min": 10, "max": 15, "label": "Yuqori stress",   "description": "Stress yuqori. Psixologga murojaat qiling." }
  ]
}
```

### Misol B — «Charchoq darajasi» (10 ta Ha/Yo'q savol, sum, reverse'siz)

```json
{
  "scoring": {
    "method": "sum",
    "reverse": []
  },
  "interpretation": [
    { "min": 0, "max": 3,  "label": "Charchamagan",  "description": "..." },
    { "min": 4, "max": 7,  "label": "Sal charchagan","description": "..." },
    { "min": 8, "max": 10, "label": "Juda charchagan","description": "..." }
  ]
}
```

### Misol C — Eysenck shaxsiyat testi (kategoriya, qisqartirilgan)

```json
{
  "scoring": {
    "method": "category",
    "reverse": [4, 8],
    "categories": {
      "ekstraversiya": [1, 3, 5, 7, 9],
      "neyrotizm":    [2, 4, 6, 8, 10]
    }
  },
  "category_interpretations": {
    "ekstraversiya": [
      { "min": 0, "max": 2, "label": "Introvert",   "description": "Yopiq, mulohazali" },
      { "min": 3, "max": 5, "label": "Ekstravert",  "description": "Ochiq, kommunikabel" }
    ],
    "neyrotizm": [
      { "min": 0, "max": 2, "label": "Barqaror",    "description": "Hissiyotlarni boshqara oladi" },
      { "min": 3, "max": 5, "label": "Hissiyotchang","description": "Stressga moyil" }
    ]
  }
}
```

---

## Tez-tez uchraydigan xatolar

| Xato | Yechim |
|---|---|
| Diagnoz «Sozlanmagan» chiqdi | `interpretation` umuman yo'q yoki bo'sh — to'liq yozing |
| Talaba ball yig'di, lekin diagnoz yo'q | Yig'ilgan ball oraliqlardan tashqarida — `min`/`max` ni kengaytiring yoki tekshiring |
| Reverse savol noto'g'ri hisoblanyapti | Ehtimol `reverse` ichida ID yozdingiz, **tartib raqami** kerak |
| Kategoriyada savol takrorlanyapti | Bir savol bir nechta kategoriyaga tushib qolgan — to'g'rilang |
| JSON saqlanmaydi | Vergul yoki tirnoq yetishmayapti — onlayn JSON validatorda tekshiring (`jsonlint.com`) |

---

## 5 daqiqalik retsept

1. **Necha xususiyat o'lchaysiz?**
   - Bittani → `sum`
   - Bir nechtani → `category`
2. **Maksimal ballni hisoblang.** Hamma savollarning eng yuqori javoblarini qo'shing.
3. **3 ta oraliqqa bo'ling** (Past / O'rta / Yuqori). Yoki 4–5 ta kerak bo'lsa shunday.
4. **Har bir oraliqqa yorliq va izoh yozing.** Talaba shuni o'qiydi — tushunarli til ishlating.
5. **Teskari savollar bo'lsa**, ularning tartib raqamlarini `reverse` ga qo'shing.
6. JSON ni admin paneldagi «Ko'rsatma (JSON)» maydoniga ko'chiring.
7. Sinov uchun o'zingiz testni topshirib ko'ring.

---

## Kelajakdagi soddalashtirish g'oyalari

JSON yozish hali ham qiyin bo'lsa, quyidagi yo'llarni ko'rib chiqish mumkin (hozircha mavjud emas):

1. **UI orqali konstruktor** — JSON o'rniga forma maydonlari («3 ta oraliq qo'shish», «kategoriya yaratish», «teskari savolni belgilash»). Tizim JSON ni o'zi yig'adi.
2. **Tayyor shablonlar tugmasi** — «Sodda 3-darajali», «Eysenck», «Stress shkalasi» va h.k. — bossa, tegishli JSON to'ldiriladi.
3. **Real-time tekshiruv** — saqlash paytida JSON ni tahlil qilib, «sizning savollaringiz uchun maks ball 10, lekin oraliq 0–20 ga sozlangan» kabi maslahatlar berish.
4. **Live preview** — admin formada o'ng tomonda «Talaba mana shunday ko'radi» degan ko'rinish.

Agar shunday soddalashtirishlar kerak bo'lsa, alohida tapshiriq sifatida qo'shamiz.
