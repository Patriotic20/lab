# Spielberger STAI-20 testi JSON — batafsil tushuntirish

Bu hujjat **Spielberger Trait Anxiety Inventory (STAI-T, 20 ta savol)** shablonini satrma-satr tahlil qiladi. Agar JSON sizga yangi bo'lsa — avval [umumiy qo'llanma](psychology-instruction-guide.md) ni o'qib chiqing, so'ng bu faylga qayting.

---

## STAI-20 testi nima?

Amerikalik psixolog Charles Spielberger tomonidan ishlab chiqilgan test. To'liq versiyasi 40 ta savoldan iborat (20 ta — joriy holat, 20 ta — shaxsiyat xususiyati). Bu hujjatda biz **shaxsiy xavotir** (Trait Anxiety) qismi bilan ishlaymiz — talabaning umumiy, **doimiy** xavotir darajasini o'lchaydi.

Test bitta umumiy ko'rsatkich beradi: **xavotir darajasi** (past / o'rtacha / yuqori). Shu sababli `sum` rejimda hisoblanadi.

Lekin bir nechta savol **teskari tarzda** yozilgan — ya'ni «xotirjamlik» haqida (masalan «Men o'zimni xotirjam his qilaman»). Bunday savollarda yuqori javob xavotirning **kamayishini** bildiradi, shuning uchun ular `reverse` ro'yxatiga qo'shiladi.

---

## To'liq JSON

Quyida biz tahlil qiladigan to'liq shablon:

```json
{
  "scoring": {
    "method": "sum",
    "reverse": [1, 6, 7, 10, 13, 16, 19]
  },
  "interpretation": [
    { "min": 20, "max": 39, "label": "Past xavotir",     "description": "Sizda umumiy xavotir darajasi past. Hayot vaziyatlariga xotirjam munosabatdasiz." },
    { "min": 40, "max": 59, "label": "O'rtacha xavotir", "description": "Xavotir o'rtacha darajada. Stress vaziyatlarida o'zingizni nazoratda tutishga harakat qiling." },
    { "min": 60, "max": 79, "label": "Yuqori xavotir",   "description": "Xavotir darajasi yuqori. Dam olish, sport va kerak bo'lsa psixologga murojaat tavsiya etiladi." },
    { "min": 80, "max": 100, "label": "Juda yuqori xavotir", "description": "Doimiy yuqori xavotir holati. Psixolog bilan suhbatlashish zarur." }
  ]
}
```

JSON ikkita asosiy qismdan iborat:
1. **`scoring`** — qanday hisoblanadi
2. **`interpretation`** — qanday tushuntiriladi

---

## Qism 1 — `scoring` (hisoblash qoidalari)

```json
"scoring": {
  "method": "sum",
  "reverse": [1, 6, 7, 10, 13, 16, 19]
}
```

### `method` — hisoblash rejimi

`"sum"` — barcha 20 savolning ballari bitta umumiy yig'indiga qo'shiladi.

STAI bitta xususiyatni o'lchagani uchun `category` emas, `sum` ishlatiladi.

### `reverse` — teskari savollar

```json
"reverse": [1, 6, 7, 10, 13, 16, 19]
```

Bu 7 ta savol **xotirjamlik / qoniqish** haqida. Talaba «5 — har doim» javobini tanlasa — bu **xavotirsizligini** bildiradi, shuning uchun ball **teskari** hisoblanishi kerak.

Tizim avtomatik ravishda `1-5` shkalada teskari aylantiradi:

| Talaba bergan javob | Teskari ball |
|:-:|:-:|
| 1 | 5 |
| 2 | 4 |
| 3 | 3 |
| 4 | 2 |
| 5 | 1 |

Boshqa 13 ta savol — to'g'ridan-to'g'ri xavotir alomatlari (asabiylik, tashvish va h.k.). Ulardagi javob qanday bo'lsa, shunday hisoblanadi.

> **Muhim qoida:** `reverse` ichidagi raqamlar — savolning **tartib raqami** (admin paneldagi «Tartib raqami» maydoni), savol ID si emas.

---

## Qism 2 — `interpretation` (tushuntirishlar)

```json
"interpretation": [
  { "min": 20, "max": 39, "label": "Past xavotir",     "description": "..." },
  { "min": 40, "max": 59, "label": "O'rtacha xavotir", "description": "..." },
  { "min": 60, "max": 79, "label": "Yuqori xavotir",   "description": "..." },
  { "min": 80, "max": 100, "label": "Juda yuqori xavotir", "description": "..." }
]
```

| Ball oralig'i | Yorliq | Izoh |
|:-:|---|---|
| 20 – 39 | **Past xavotir** | Xavotir kam, hayot muvozanatda |
| 40 – 59 | **O'rtacha xavotir** | Stress vaziyatlarida o'zini nazorat qilish kerak |
| 60 – 79 | **Yuqori xavotir** | Dam olish, sport, psixologga murojaat |
| 80 – 100 | **Juda yuqori xavotir** | Psixolog bilan suhbat shart |

### Nega `min` 0 dan emas, 20 dan boshlanadi?

Har bir savol 1–5 shkalada — eng past javob ham **1 ball** beradi. 20 ta savol × 1 = **20** (minimal yig'indi). Maksimal: 20 × 5 = **100**.

Shuning uchun oraliqlar **20 dan 100 gacha** bo'lishi kerak. Agar 0 dan boshlasangiz, hech qaysi talaba 0–19 oraliqqa tushmaydi va xato chiqishi mumkin.

---

## Amaliy misol — qanday hisoblanadi?

Faraz qilaylik, talaba STAI testini topshirdi va quyidagi javoblarni berdi (1 = umuman emas, 5 = har doim):

| Savol | Tartib | Toifa | Javob | Reverse? | Yakuniy ball |
|:-:|:-:|---|:-:|:-:|:-:|
| «Xotirjamman» | 1 | reverse | 2 | ha | 4 |
| «Asabiyman» | 2 | to'g'ri | 4 | yo'q | 4 |
| «Tashvishlanaman» | 3 | to'g'ri | 3 | yo'q | 3 |
| «Afsuslanaman» | 4 | to'g'ri | 3 | yo'q | 3 |
| «Charchaganman» | 5 | to'g'ri | 4 | yo'q | 4 |
| «Baxtliman» | 6 | reverse | 2 | ha | 4 |
| «O'zimga ishonaman» | 7 | reverse | 3 | ha | 3 |
| «Qiyinchiliklar bosadi» | 8 | to'g'ri | 4 | yo'q | 4 |
| «Yo'qotgandek tuyulaman» | 9 | to'g'ri | 3 | yo'q | 3 |
| «Xavfsizman» | 10 | reverse | 2 | ha | 4 |
| «Yetarli emasman» | 11 | to'g'ri | 4 | yo'q | 4 |
| «Vahima qilaman» | 12 | to'g'ri | 3 | yo'q | 3 |
| «Qoniqarliman» | 13 | reverse | 3 | ha | 3 |
| «Qiyin qarordan qochaman» | 14 | to'g'ri | 4 | yo'q | 4 |
| «Ruhiy charchoq» | 15 | to'g'ri | 4 | yo'q | 4 |
| «Baxtiyorman» | 16 | reverse | 2 | ha | 4 |
| «Mayda muammo bezovta qiladi» | 17 | to'g'ri | 4 | yo'q | 4 |
| «Ko'ngilsizlikni unutolmayman» | 18 | to'g'ri | 4 | yo'q | 4 |
| «Barqarorman» | 19 | reverse | 3 | ha | 3 |
| «Kelajakdan qo'rqaman» | 20 | to'g'ri | 3 | yo'q | 3 |

### 1-qadam: yakuniy ballarni qo'shamiz

`4 + 4 + 3 + 3 + 4 + 4 + 3 + 4 + 3 + 4 + 4 + 3 + 3 + 4 + 4 + 4 + 4 + 4 + 3 + 3 = 72`

### 2-qadam: jadvaldan diagnozni topamiz

Ball `72` → oraliq `60-79` → **Yuqori xavotir**

### 3-qadam: talaba ekranda shuni ko'radi

```
 Test yakunlandi!

 Umumiy ball: 72 / 100
 ─────────────────────────────────────
   Yuqori xavotir
   Xavotir darajasi yuqori. Dam olish,
   sport va kerak bo'lsa psixologga
   murojaat tavsiya etiladi.
 ─────────────────────────────────────
```

---

## Savollarni qanday tuzish kerak?

20 ta savol kerak — har biri **`scale`** turida, shkala **1 dan 5 gacha**:

| Ball | Ma'no |
|:-:|---|
| 1 | Umuman shunday emas |
| 2 | Kam hollarda shunday |
| 3 | Ba'zan shunday |
| 4 | Ko'p hollarda shunday |
| 5 | Deyarli har doim shunday |

### Tayyor savollar (Uzbek)

«Reverse?» ustunidagi belgi — bu savol `reverse` ro'yxatiga qo'shilishi kerakligini bildiradi.

| Tartib | Savol matni | Reverse? |
|:-:|---|:-:|
| 1 | Men o'zimni xotirjam his qilaman | ✓ |
| 2 | Men tez asabiylashaman | — |
| 3 | Men kelajakdagi muvaffaqiyatsizliklar haqida ko'p o'ylayman | — |
| 4 | Men qilgan ishlarim uchun afsuslanaman | — |
| 5 | Men o'zimni jismoniy va ruhiy jihatdan charchagan his qilaman | — |
| 6 | Men o'zimni baxtli his qilaman | ✓ |
| 7 | Men o'zimga ishonaman | ✓ |
| 8 | Men hal qilinmagan muammolar yig'ilib qolganini his qilaman | — |
| 9 | Men muhim narsalarni yo'qotib qo'yganday tuyulaman | — |
| 10 | Men o'zimni xavfsiz va himoyalangan his qilaman | ✓ |
| 11 | Men boshqalardan kamroq qobiliyatga ega deb hisoblayman | — |
| 12 | Men kichik bir hodisadan ham vahima qilaman | — |
| 13 | Men hayotimdan qoniqaman | ✓ |
| 14 | Men muhim qarorlarni qabul qilishdan qochaman | — |
| 15 | Men ko'pincha ruhiy charchoqni his qilaman | — |
| 16 | Men ertangi kunga ishonch bilan qarayman | ✓ |
| 17 | Mayda muammolar ham meni uzoq vaqt bezovta qiladi | — |
| 18 | Ko'ngilsiz hodisalarni xayolimdan chiqara olmayman | — |
| 19 | Men hissiy jihatdan barqarorman | ✓ |
| 20 | Kelajak haqida o'ylaganda yuragim siqiladi | — |

**Reverse savollar tartib raqamlari:** 1, 6, 7, 10, 13, 16, 19 — bular `reverse` ro'yxatida bo'lishi kerak.

### Admin panelda savol qo'shganda nimalarni belgilash kerak?

Har bir savol uchun:
- **Tartib raqami:** 1 dan 20 gacha (jadvalga qarang)
- **Savol turi:** `scale`
- **Mazmuni (content):** `{ "min": 1, "max": 5 }` (yoki frontend formada «Min» va «Max» maydonlari)
- **Variantlar matnlari:** ixtiyoriy — agar kiritsangiz, talaba ekranda raqam o'rniga matnni ko'radi:
  ```json
  {
    "min": 1,
    "max": 5,
    "labels": ["Umuman emas", "Kam", "Ba'zan", "Ko'p", "Har doim"]
  }
  ```

---

## `reverse` ni qanday qo'llaniladi?

Misol: 1-savol — **«Men o'zimni xotirjam his qilaman»**.

Talaba «5 — har doim» tanlasa, bu uning xavotirsiz ekanligini bildiradi. Lekin biz **xavotir ballini** yig'amiz — bu yerda 5 ball berish noto'g'ri. Tizim avtomatik teskari aylantiradi: `5 → 1`.

Aksincha, agar talaba «1 — umuman emas» (ya'ni «xotirjam emasman») tanlasa, bu xavotir alomatidir → `1 → 5`.

Shu sababli STAI shablonida 7 ta «xotirjamlik» savoli `reverse: [1, 6, 7, 10, 13, 16, 19]` ga kiritilgan.

---

## Qanday moslashtirish mumkin?

### 1. Oraliqlarni 3 ga qisqartirish

To'rtta oraliq ko'p tuyulsa, uchtaga keltiring:

```json
"interpretation": [
  { "min": 20, "max": 39, "label": "Past xavotir",     "description": "..." },
  { "min": 40, "max": 59, "label": "O'rtacha xavotir", "description": "..." },
  { "min": 60, "max": 100, "label": "Yuqori xavotir",  "description": "..." }
]
```

### 2. To'liq STAI (40 ta savol) ga kengaytirish

Joriy holat (State Anxiety) shkalasi bilan birga ishlatish uchun `category` rejimga o'ting:

```json
{
  "scoring": {
    "method": "category",
    "reverse": [1, 6, 7, 10, 13, 16, 19, 21, 26, 27, 30, 33, 36, 39],
    "categories": {
      "trait":  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      "state":  [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
    }
  },
  "category_interpretations": {
    "trait": [
      { "min": 20, "max": 39, "label": "Past", "description": "..." },
      { "min": 40, "max": 59, "label": "O'rtacha", "description": "..." },
      { "min": 60, "max": 100, "label": "Yuqori", "description": "..." }
    ],
    "state": [
      { "min": 20, "max": 39, "label": "Past", "description": "..." },
      { "min": 40, "max": 59, "label": "O'rtacha", "description": "..." },
      { "min": 60, "max": 100, "label": "Yuqori", "description": "..." }
    ]
  }
}
```

### 3. Shkalani 1-4 ga o'zgartirish (klassik STAI)

Klassik STAI 1–4 shkalada. Agar shunday istasangiz:
- Har savol uchun `content: { "min": 1, "max": 4 }`
- Maksimal yig'indi: 20 × 4 = **80**
- Oraliqlarni shunga moslang:

```json
"interpretation": [
  { "min": 20, "max": 37, "label": "Past xavotir",     "description": "..." },
  { "min": 38, "max": 44, "label": "O'rtacha xavotir", "description": "..." },
  { "min": 45, "max": 80, "label": "Yuqori xavotir",   "description": "..." }
]
```

---

## Tez-tez uchraydigan xatolar

| Xato | Sabab | Yechim |
|---|---|---|
| Talaba 25 ball oldi, lekin diagnoz yo'q | `min` 0 dan boshlangan, lekin haqiqiy minimal — 20 | `interpretation` da `min: 20` dan boshlang |
| Xavotirsiz talaba «Yuqori xavotir» olyapti | Reverse savollar `reverse` ro'yxatiga qo'shilmagan | `[1, 6, 7, 10, 13, 16, 19]` ni qo'shing |
| Reverse savollar **ID** raqami bilan ko'rsatilgan | ID emas, **tartib raqami** kerak | Admin panelda «Tartib raqami» maydonini qarang |
| 4 ta variantli savol qildim, lekin ball noto'g'ri | `content.max` 5 turibdi, lekin variantlar 4 ta | `content: { "min": 1, "max": 4 }` ga o'zgartiring |
| Diagnoz «Sozlanmagan» chiqdi | `interpretation` ro'yxati bo'sh | Yuqoridagi shablonni to'liq ko'chiring |
| JSON saqlanmaydi | Vergul yoki tirnoq yetishmayapti | [jsonlint.com](https://jsonlint.com) da tekshiring |

---

## Xulosa — 5 ta qadam

1. **Yangi metod yarating**: «Spielberger xavotir testi (STAI-T)».
2. **Ko'rsatma (JSON)** maydoniga yuqoridagi to'liq shablonni ko'chiring.
3. **20 ta savol qo'shing** — yuqoridagi jadval bo'yicha. Har biri `scale`, `min: 1`, `max: 5`.
4. **Reverse savollarni tekshiring** — 1, 6, 7, 10, 13, 16, 19 raqamli savollar `reverse` ro'yxatida bo'lishi shart.
5. **O'zingiz sinab ko'ring** — student bo'lib login qilib testni topshiring.

---

Qo'shimcha savollar bo'lsa — [umumiy qo'llanma](psychology-instruction-guide.md) yoki [Eysenck testi tushuntirishi](psychology-eysenck-explain.md) da javob bo'lishi mumkin.
