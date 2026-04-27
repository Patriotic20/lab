// Generates frontend/public/templates/psychology-import-template.xlsx
//
// Run from anywhere:
//   node scripts/generate-psychology-template.cjs

const path = require('path');
const { mkdirSync } = require('fs');
const { dirname, resolve } = require('path');

const xlsxPath = path.resolve(__dirname, '..', 'frontend/node_modules/xlsx');
const XLSX = require(xlsxPath);

const OUT = resolve(__dirname, '..', 'frontend/public/templates/psychology-import-template.xlsx');

// Faqat savol ma'lumoti — kategoriya va tartib raqami yuklanayotgan kontekstdan olinadi.
const headers = [
    'savol_turi', 'matn',
    'shkala_min', 'shkala_max', 'shkala_min_belgi', 'shkala_max_belgi',
    'variant_1_matn', 'variant_1_qiymat',
    'variant_2_matn', 'variant_2_qiymat',
    'variant_3_matn', 'variant_3_qiymat',
    'variant_4_matn', 'variant_4_qiymat',
];

const rows = [
    ['matnli', "Sizga ko'p odamlar bilan tanishish yoqadimi?",
        '', '', '', '',
        'Ha, doim', 2, "Ko'pincha", 1, 'Kamdan-kam', 0, "Yo'q", -1],
    ['matnli', "Sizga yangi joyda yolg'iz qolish noqulaymi?",
        '', '', '', '',
        'Ha', 1, "Yo'q", 0, '', '', '', ''],
    ['ha_yoq', "Ko'p hollarda o'zimni xotirjam his qilaman",
        '', '', '', '', '', '', '', '', '', '', '', ''],
    ['ha_yoq', 'Tez asabiylashaman',
        '', '', '', '', '', '', '', '', '', '', '', ''],
    ['shkala', 'Hozirgi paytda stress darajangiz qanday?',
        1, 5, "Umuman yo'q", 'Juda yuqori', '', '', '', '', '', '', '', ''],
    ['shkala', 'Bugungi kayfiyatingizni 0 dan 10 gacha baholang',
        0, 10, 'Juda yomon', "A'lo", '', '', '', '', '', '', '', ''],
];

const wb = XLSX.utils.book_new();

const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 14) }));
XLSX.utils.book_append_sheet(wb, ws, 'Savollar');

const guideRows = [
    ["Yo'riqnoma — psixologik savol import shabloni"],
    [''],
    ['Har bir qator — bitta savol. Faqat savol ma\'lumotini yozing.'],
    ['Kategoriya va tartib raqami avtomatik biriktiriladi (qaysi kategoriyaga'],
    ["import qilayotganingizdan kelib chiqib)."],
    [''],
    ["savol_turi ustuni majburiy. Ruxsat etilgan qiymatlar:"],
    ["  matnli       — matn + kamida 2 ta variant"],
    ["  ha_yoq       — faqat matn (variantlar va shkala bo'sh)"],
    ["  shkala       — matn + shkala_min + shkala_max (belgilar ixtiyoriy)"],
    [''],
    ["matn ustuni — savol/bayonot matni, har doim majburiy."],
    [''],
    ["matnli savollar uchun:"],
    ["  variant_N_matn   — javob varianti matni (kamida 2 ta to'ldiring)"],
    ["  variant_N_qiymat — shu variant uchun ball (butun son)"],
    [''],
    ["shkala savollar uchun:"],
    ["  shkala_min, shkala_max — minimum va maksimum qiymatlar (raqam)"],
    ["  shkala_min_belgi, shkala_max_belgi — chetlardagi yozuvlar (ixtiyoriy)"],
    [''],
    ["Eslatma: image_stimulus va image_choice turlari Excel orqali"],
    ["qo'llab-quvvatlanmaydi — rasm-savollarni qo'lda UI orqali kiriting."],
];
const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
wsGuide['!cols'] = [{ wch: 90 }];
XLSX.utils.book_append_sheet(wb, wsGuide, "Yo'riqnoma");

mkdirSync(dirname(OUT), { recursive: true });
XLSX.writeFile(wb, OUT);
console.log('Wrote', OUT);
