# Eysenck testi JSON — batafsil tushuntirish

Bu hujjat **Eysenck shaxsiyat testi** shablonini satrma-satr tahlil qiladi. Agar JSON sizga yangi bo'lsa — avval [umumiy qo'llanma](psychology-instruction-guide.md) ni o'qib chiqing, so'ng bu faylga qayting.

---

## Eysenck testi nima?

Ingliz psixologi Hans Eysenck tomonidan ishlab chiqilgan test. **Ikki** asosiy shaxsiyat xususiyatini o'lchaydi:

- **Ekstraversiya** (Extraversion) — odam qanchalik ochiq, kommunikabel, tashqariga yo'nalgan
- **Neyrotizm** (Neuroticism) — odam qanchalik hissiy jihatdan beqaror, stressga moyil

Natijada talaba **ikkita** diagnoz oladi: bittasi ekstraversiya shkalasi bo'yicha, ikkinchisi neyrotizm bo'yicha.

Shuning uchun bu test **sodda yig'indi** (`sum`) bilan emas, balki **kategoriyalar bo'yicha** (`category`) rejimda hisoblanadi.

---

## To'liq JSON

Quyida biz tahlil qiladigan to'liq shablon:

```json
{
  "scoring": {
    "method": "category",
    "reverse": [],
    "categories": {
      "ekstraversiya": [1, 3, 5, 7, 9],
      "neyrotizm":     [2, 4, 6, 8, 10]
    }
  },
  "category_interpretations": {
    "ekstraversiya": [
      { "min": 0, "max": 2, "label": "Introvert",  "description": "Yopiq, mulohazali xarakter." },
      { "min": 3, "max": 5, "label": "Ekstravert", "description": "Ochiq, kommunikabel xarakter." }
    ],
    "neyrotizm": [
      { "min": 0, "max": 2, "label": "Barqaror",     "description": "Hissiyotlarni boshqara oladi." },
      { "min": 3, "max": 5, "label": "Hissiyotchang","description": "Stressga moyil, sezgir." }
    ]
  }
}
```

JSON ikkita asosiy qismdan iborat:
1. **`scoring`** — qanday hisoblanadi
2. **`category_interpretations`** — qanday tushuntiriladi

---

## Qism 1 — `scoring` (hisoblash qoidalari)

```json
"scoring": {
  "method": "category",
  "reverse": [],
  "categories": {
    "ekstraversiya": [1, 3, 5, 7, 9],
    "neyrotizm":     [2, 4, 6, 8, 10]
  }
}
```

### `method` — hisoblash rejimi

| Qiymat | Nima bo'ladi |
|---|---|
| `"sum"` | Barcha javoblar **bitta umumiy yig'indi** ga qo'shiladi |
| `"category"` | Javoblar **kategoriyalar bo'yicha alohida** hisoblanadi |

Eysenck-da `"category"` — chunki bizga ikkita alohida natija kerak.

### `reverse` — teskari savollar

```json
"reverse": []
```

Hozirda bo'sh. Agar biror savol "teskari" yozilgan bo'lsa (masalan, «Men doim xotirjaman» — Ha deyilganda neyrotizm kamayadi), shu savolning tartib raqamini bu ro'yxatga qo'ying:

```json
"reverse": [4]
```

Tizim avtomatik ravishda:
- `Ha/Yo'q` uchun: `Ha (1) ↔ Yo'q (0)`
- Shkala `1-5` uchun: `1↔5, 2↔4, 3↔3`

### `categories` — savollarni guruhlash

```json
"categories": {
  "ekstraversiya": [1, 3, 5, 7, 9],
  "neyrotizm":     [2, 4, 6, 8, 10]
}
```

Bu joyda biz **qaysi savol qaysi xususiyatni o'lchashini** belgilaymiz.

| Kategoriya nomi | Savol tartib raqamlari |
|---|---|
| `ekstraversiya` | 1, 3, 5, 7, 9 (toq raqamlar) |
| `neyrotizm` | 2, 4, 6, 8, 10 (juft raqamlar) |

> **Muhim qoida:** bu yerdagi raqamlar savolning **tartib raqami** (admin panelidagi «Tartib raqami» maydoni), savol ID si emas.

> **Muhim qoida:** bir savol **faqat bitta** kategoriyada bo'lishi kerak. Agar savol 1 ikkala joyda bo'lsa — ikki marta hisoblanadi.

---

## Qism 2 — `category_interpretations` (tushuntirishlar)

Har bir kategoriya uchun **alohida** jadval. Tizim yig'ilgan ballga qarab to'g'ri yorliqni (`label`) va izohni (`description`) topib beradi.

### Ekstraversiya jadvali

```json
"ekstraversiya": [
  { "min": 0, "max": 2, "label": "Introvert",  "description": "Yopiq, mulohazali xarakter." },
  { "min": 3, "max": 5, "label": "Ekstravert", "description": "Ochiq, kommunikabel xarakter." }
]
```

| Ball | Yorliq | Izoh |
|---|---|---|
| 0 – 2 | **Introvert** | Yopiq, mulohazali xarakter |
| 3 – 5 | **Ekstravert** | Ochiq, kommunikabel xarakter |

Ekstraversiya kategoriyasida 5 ta savol bo'lgani uchun maksimal ball = 5. Ikki oraliqqa bo'lingan: 0-2 va 3-5.

### Neyrotizm jadvali

```json
"neyrotizm": [
  { "min": 0, "max": 2, "label": "Barqaror",     "description": "Hissiyotlarni boshqara oladi." },
  { "min": 3, "max": 5, "label": "Hissiyotchang","description": "Stressga moyil, sezgir." }
]
```

| Ball | Yorliq | Izoh |
|---|---|---|
| 0 – 2 | **Barqaror** | Hissiyotlarni boshqara oladi |
| 3 – 5 | **Hissiyotchang** | Stressga moyil, sezgir |

---

## Amaliy misol — qanday hisoblanadi?

Faraz qilaylik, talaba Eysenck testini topshirdi. Uning javoblari:

| Savol raqami | Kategoriya | Javob | Ball |
|:-:|---|:-:|:-:|
| 1 | Ekstraversiya | Ha | 1 |
| 2 | Neyrotizm | Ha | 1 |
| 3 | Ekstraversiya | Yo'q | 0 |
| 4 | Neyrotizm | Ha | 1 |
| 5 | Ekstraversiya | Ha | 1 |
| 6 | Neyrotizm | Ha | 1 |
| 7 | Ekstraversiya | Ha | 1 |
| 8 | Neyrotizm | Yo'q | 0 |
| 9 | Ekstraversiya | Yo'q | 0 |
| 10 | Neyrotizm | Ha | 1 |

### 1-qadam: kategoriyalar bo'yicha yig'amiz

**Ekstraversiya (savollar 1, 3, 5, 7, 9):**

`1 + 0 + 1 + 1 + 0 = 3`

**Neyrotizm (savollar 2, 4, 6, 8, 10):**

`1 + 1 + 1 + 0 + 1 = 4`

### 2-qadam: jadvaldan diagnozni topamiz

**Ekstraversiya:** ball `3` → oraliq `3-5` → **Ekstravert**

**Neyrotizm:** ball `4` → oraliq `3-5` → **Hissiyotchang**

### 3-qadam: talaba ekranda shuni ko'radi

```
 Test yakunlandi!

 Kategoriyalar bo'yicha natija
 ─────────────────────────────────────
   Ekstraversiya            Ball: 3
   Ekstravert
   Ochiq, kommunikabel xarakter.
 ─────────────────────────────────────
   Neyrotizm                Ball: 4
   Hissiyotchang
   Stressga moyil, sezgir.
 ─────────────────────────────────────
```

---

## Savollarni qanday tuzish kerak?

Bu shablon ishlashi uchun **10 ta savol** yaratish kerak — har biri `true_false` turida. Har savolga **tartib raqami** berasiz (1 dan 10 gacha).

### Ekstraversiya uchun savollar (toq tartib)

| Tartib | Taxminiy savol matni |
|:-:|---|
| 1 | Men begona odamlar bilan oson muloqot qilaman |
| 3 | Katta kompaniyalarda o'zimni erkin his qilaman |
| 5 | Menga yig'ilishlar va tadbirlar yoqadi |
| 7 | Men ko'p gaplashaman |
| 9 | Yangi odamlar bilan tanishish qiziq |

### Neyrotizm uchun savollar (juft tartib)

| Tartib | Taxminiy savol matni |
|:-:|---|
| 2 | Men arzimas narsalar uchun ham xavotir olaman |
| 4 | Tez-tez kayfiyatim buziladi |
| 6 | Stress meni tez charchatadi |
| 8 | Kechalari uxlay olmay qiynalaman |
| 10 | Qaror qabul qilish men uchun qiyin |

Har bir savol `true_false` turida bo'lgani uchun talaba faqat **Ha** yoki **Yo'q** javob beradi. "Ha" = 1 ball, "Yo'q" = 0 ball.

---

## `reverse` ni qachon ishlatish kerak?

Ba'zan savol teskari tarzda yozilgan bo'ladi. Masalan:

> Savol 4: **«Men har doim xotirjamman»**

Bu savol neyrotizm kategoriyasida, ammo "Ha" javobi neyrotizmni **kamaytirishi** kerak (xotirjam odam — kam stressli). Agar shu holatda "Ha" = 1 ball deb sanasak, natija teskari chiqadi.

Yechim — bu savolni `reverse` ga qo'shish:

```json
"reverse": [4]
```

Endi tizim savol 4 uchun javobni avtomatik inverlaydi: **Ha** → 0, **Yo'q** → 1.

Bir nechta teskari savol bo'lsa:

```json
"reverse": [4, 6, 8]
```

---

## Qanday moslashtirish mumkin?

### 1. Oraliqlarni uchga bo'lish (past / o'rta / yuqori)

Agar ikkita daraja yetarli bo'lmasa, uchta oraliqqa bo'ling:

```json
"ekstraversiya": [
  { "min": 0, "max": 1, "label": "Kuchli introvert", "description": "..." },
  { "min": 2, "max": 3, "label": "O'rtacha",         "description": "..." },
  { "min": 4, "max": 5, "label": "Kuchli ekstravert","description": "..." }
]
```

### 2. Kategoriyalarni ko'paytirish

Masalan, psikotizm (P) ni qo'shish:

```json
"categories": {
  "ekstraversiya": [1, 4, 7, 10],
  "neyrotizm":     [2, 5, 8, 11],
  "psikotizm":     [3, 6, 9, 12]
}
```

va `category_interpretations` ga `"psikotizm": [...]` jadvalini qo'shing.

### 3. Har kategoriyadagi savollar sonini o'zgartirish

Masalan, ekstraversiyada 10, neyrotizmda 5 savol bo'lsa:

```json
"categories": {
  "ekstraversiya": [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
  "neyrotizm":     [2, 4, 6, 8, 10]
}
```

**Muhim:** shu holda ekstraversiya uchun maksimal ball 10 bo'ladi — jadvaldagi `max` ni shunga moslang:

```json
"ekstraversiya": [
  { "min": 0, "max": 3,  "label": "Introvert",  "description": "..." },
  { "min": 4, "max": 7,  "label": "Muvozanatli","description": "..." },
  { "min": 8, "max": 10, "label": "Ekstravert", "description": "..." }
]
```

### 4. Shkala savollaridan foydalanish

`true_false` o'rniga `scale` (1-5) savollar bilan:
- Har savol 1 dan 5 gacha ball beradi
- 5 ta savoldan maksimal `25` ball chiqadi
- `min`/`max` oraliqlarini shunga moslang

---

## Tez-tez uchraydigan xatolar

| Xato | Sabab | Yechim |
|---|---|---|
| «Diagnostika sozlanmagan» plashkasi | `interpretation` yoki `category_interpretations` yo'q | Jadvalni qo'shing |
| Talaba 4 ball oldi, lekin diagnoz yo'q | 4 ball hech qaysi oraliqqa tushmaydi | `min`/`max` ni tekshiring — 4 qaerga kirishi kerak? |
| Savol ikki marta hisoblandi | Savol tartib raqami ikkita kategoriyada ko'rsatilgan | `categories` ichida har raqamni bitta joyda qoldiring |
| Natija teskari chiqdi | Teskari formulirovka savolida `reverse` yo'q | Savol raqamini `reverse` ga qo'shing |
| JSON saqlanmaydi | Vergul yoki tirnoq yetishmayapti | [jsonlint.com](https://jsonlint.com) da tekshiring |
| `category_interpretations` ichidagi kalit `scoring.categories` dagidan farq qiladi | Imlo xatosi — masalan `"ekstraversia"` vs `"ekstraversiya"` | Ikkala joydagi kalitlar **aniq bir xil** bo'lishi kerak |

---

## Xulosa — 5 ta qadam

1. **Metodni yarating** (nom, tavsif).
2. **Ko'rsatma (JSON) maydoniga shablonni ko'chiring**. Admin paneldagi «Shablonlar» tugmasidan Eysenck ni tanlash mumkin.
3. **10 ta savol qo'shing** — yuqoridagi jadval bo'yicha.
4. **Teskari savollar bo'lsa** — `reverse` ga raqamlarini kiriting.
5. **O'zingiz sinab ko'ring** — student bo'lib login qilib testni topshiring.

---

Qo'shimcha savollar bo'lsa — [umumiy qo'llanma](psychology-instruction-guide.md) da javob bo'lishi mumkin.
