// Generates per-category xlsx files for the temperament test (Metodika 1)
// based on questions extracted from "Шахс каратаси калити.docx".
//
// Output: frontend/public/templates/temperament/<category>.xlsx
//
// Run:
//   node scripts/generate-temperament-xlsx.cjs

const path = require('path');
const fs = require('fs');

const xlsxPath = path.resolve(__dirname, '..', 'frontend/node_modules/xlsx');
const XLSX = require(xlsxPath);

// Hard-coded questions extracted from the docx (split-at-20 mapping).
// Each category contributes a "Ha" answer = 1 ball; sum per category determines
// the dominant temperament type.
const QUESTIONS = {
    xolerik: [
        'Besaramjon behalovatsiz',
        "O'zini tuta olmaydigan tez jahlingiz chiqadi",
        'Betoqatsiz',
        'Odamlar bilan munosabatingiz keskin',
        "Qat'iyatli va tashabbuskorsiz",
        "O'jar va qaysarsiz",
        'Tortishuv va bahslarda topqirsiz',
        'Bir xil tempda ishlamaysiz',
        'Tavakkalchilikka moyilligingiz bor',
        'Yomon narsalarni eslab yurmaysiz',
        "Nutqingiz tez bo'linuvchan ohangga ega",
        'Muvozanatsiz tez qizishib ketishga moyilligingiz bor',
        'Tez urishib ketadigan janjalkashsiz',
        'Kamchiliklarga toqat qilmaysiz',
        'Ifodali mimika egasiz',
        'Tez harakat qilasiz qarorga kelasiz',
        'Yangilikka doim intilasiz',
        'Harakatlaringiz keskin va uzilishli',
        "O'z oldingizga qo'ygan maqsadni albatta amalga oshirasiz",
        "Kayfiyatingiz tez o'zgarishga moyil",
    ],
    sangvenik: [
        'Dilkash va quvnoqsiz',
        'Tirishqoq va ishbilarmonsiz',
        "Ko'p hollarda boshlagan ishini oxiriga yetkazmaysiz",
        "O'zingizni yuqori baholaysiz",
        "Yangilikni tez o'zlashtirib olasiz",
        'Qiziqish va intilishlaringiz beqaror',
        'Muvaffaqiyatsizlikni tez unutasiz',
        'Turli sharoitga tez moslashasiz',
        'Har qanday yangi ishga qiziqish bilan kirishasiz',
        "Yangi ishga tez kirishasiz va tez birdan ikkinchisiga o'ta olasiz",
        'Agar ish sizni qiziqtirmay qolsa tez soviysiz',
        'Bir xil tempdagi ishlarda tez toliqasiz',
        'Muomalaga tez kirishasiz',
        'Chidamli va mehnatsevarsiz',
        'Nutqingiz baland tez mimika va imo-ishoralarga boy',
        "Qiyin vaziyatda o'zingizni tuta bilasiz",
        'Doimo tetik kayfiyatda yurasiz',
        'Tez qarorga kelib undan voz kechasiz',
        "Tez chalg'iysiz",
        'Behuda shoshilasiz',
    ],
    flegmatik: [
        'Osoyishta va sovuqqonsiz',
        'Ishda tartibli izchilsiz',
        'Ehtiyotkor va aql bilan ish tutasiz',
        'Sabr-toqat bilan kuta olasiz',
        "Bo'lar-bo'lmas narsalar haqida gapirmay sukut saqlay bilasiz",
        'Nutqingiz osoyishta bir xil tempda va hech qanday ifodali harakatlarga ega emas',
        "Chidamli va o'zingizni tuta bilasiz",
        'Boshlagan ishni oxiriga yetkaza olasiz',
        'Behudaga kuch sarflamaysiz',
        "Ish rejimi va kun tartibiga qat'iy rioya qilasiz",
        'Ehtirosni hayajonni osongina yengasiz',
        "Tanqid va maqtovga e'tibor qilmaysiz",
        "Yuvosh va ko'ngilchansiz",
        'Qiziqish va munosabatlaringiz barqaror',
        "Ishga sekin moslashib boshqa ishga o'tishga qiynalasiz",
        'Munosabatlaringiz turli tuman',
        "Har bir narsada tartib va intizom bo'lishini hohlaysiz",
        'Yangi sharoitga qiyinchilik bilan moslashasiz',
        'Kayfiyatingiz barqaror',
        "Vazmin tabiatli og'ir-bosiqsiz",
    ],
    melanxolik: [
        'Uyatchan va tortinchoqsiz',
        "Yangi sharoitda o'zingizni yo'qotib qo'yasiz",
        "Notanish kishilar bilan aloqa o'rnatishga qiynalasiz",
        "O'z kuchingizga ishonmaysiz",
        "Yolg'izlikni yoqtirasiz",
        'Muvaffaqiyatsizlikda tez tushkunlikka berilasiz',
        'Tez charchaysiz',
        'Nutqingiz sekin kuchsiz',
        "Boshqalar ta'siriga tez berilasiz",
        "Ta'sirlanuvchan tez yig'laysiz",
        'Tanqid va maqtovni tez qabul qilasiz',
        "O'zingiz va boshqalarga nisbatan talabchansiz",
        'Shubha va gumonga tez berilasiz',
        "Tez xafa bo'lasiz va arazlaysiz",
        "Har bir narsani o'zingizga tez qabul qilasiz",
        'Muloqotga kirishishga qiynalasiz',
        "Boshqalarga fikringizni aytishni yoqtirmaysiz",
        'Sust va kam faollik bilan ajralib turasiz',
        'Tez buysunasiz itoatkorsiz',
        "Boshqalardan yordam hissini uyg'otishga harakat qilasiz",
    ],
};

const HEADERS = [
    'savol_turi', 'matn',
    'shkala_min', 'shkala_max', 'shkala_min_belgi', 'shkala_max_belgi',
    'variant_1_matn', 'variant_1_qiymat',
    'variant_2_matn', 'variant_2_qiymat',
    'variant_3_matn', 'variant_3_qiymat',
    'variant_4_matn', 'variant_4_qiymat',
];

const OUT_DIR = path.resolve(__dirname, '..', 'frontend/public/templates/temperament');
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [key, questions] of Object.entries(QUESTIONS)) {
    const rows = questions.map(q => [
        'ha_yoq', q,
        '', '', '', '',
        '', '', '', '', '', '', '', '',
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
    ws['!cols'] = HEADERS.map(h => ({ wch: Math.max(h.length, h === 'matn' ? 60 : 14) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Savollar');

    const filename = `temperament-${key}.xlsx`;
    const out = path.join(OUT_DIR, filename);
    XLSX.writeFile(wb, out);
    console.log('Wrote', out, `(${questions.length} questions)`);
}
