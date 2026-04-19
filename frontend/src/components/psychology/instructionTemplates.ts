export interface InstructionTemplate {
    id: string;
    name: string;
    hint: string;
    instruction: Record<string, unknown>;
}

export const INSTRUCTION_TEMPLATES: InstructionTemplate[] = [
    {
        id: 'simple-3',
        name: 'Sodda 3-darajali (Past / O\'rta / Yuqori)',
        hint: 'Bitta xususiyat o\'lchanadi, jami ball 0-15 oraliqda',
        instruction: {
            scoring: { method: 'sum', reverse: [] },
            interpretation: [
                { min: 0, max: 5, label: 'Past', description: 'Past darajadagi izoh — bu yerga to\'ldiring' },
                { min: 6, max: 10, label: "O'rtacha", description: "O'rta darajadagi izoh — bu yerga to'ldiring" },
                { min: 11, max: 15, label: 'Yuqori', description: 'Yuqori darajadagi izoh — bu yerga to\'ldiring' },
            ],
        },
    },
    {
        id: 'stress',
        name: 'Stress darajasi (5 savol)',
        hint: 'Tayyor stress testi shabloni, jami ball 0-15',
        instruction: {
            scoring: { method: 'sum', reverse: [3] },
            interpretation: [
                { min: 0, max: 4, label: 'Past stress', description: 'Sizda stress darajasi past. Hayotingiz muvozanatda, kundalik vazifalar sizni charchatmaydi.' },
                { min: 5, max: 9, label: "O'rtacha stress", description: "Vaqti-vaqti bilan dam olish, sport bilan shug'ullanish va to'g'ri ovqatlanishga e'tibor bering." },
                { min: 10, max: 15, label: 'Yuqori stress', description: 'Psixolog bilan maslahatlashing, kun tartibini qayta ko\'rib chiqing va relaksatsiya texnikalarini o\'rganing.' },
            ],
        },
    },
    {
        id: 'fatigue',
        name: 'Charchoq darajasi (10 ta Ha/Yo\'q)',
        hint: 'Har bir Ha — 1 ball; jami 0-10',
        instruction: {
            scoring: { method: 'sum', reverse: [] },
            interpretation: [
                { min: 0, max: 3, label: 'Charchamagan', description: 'Energiya darajangiz yaxshi.' },
                { min: 4, max: 7, label: 'Sal charchagan', description: 'Vaqti-vaqti bilan dam olishga ehtiyoj bor.' },
                { min: 8, max: 10, label: 'Juda charchagan', description: 'Dam olish va uyquga jiddiy e\'tibor bering.' },
            ],
        },
    },
    {
        id: 'eysenck',
        name: 'Eysenck shaxsiyat (Ekstraversiya + Neyrotizm)',
        hint: 'Kategoriya rejimida 2 xususiyat, savollar guruhi sozlash kerak',
        instruction: {
            scoring: {
                method: 'category',
                reverse: [],
                categories: {
                    ekstraversiya: [1, 3, 5, 7, 9],
                    neyrotizm: [2, 4, 6, 8, 10],
                },
            },
            category_interpretations: {
                ekstraversiya: [
                    { min: 0, max: 2, label: 'Introvert', description: 'Yopiq, mulohazali xarakter.' },
                    { min: 3, max: 5, label: 'Ekstravert', description: 'Ochiq, kommunikabel xarakter.' },
                ],
                neyrotizm: [
                    { min: 0, max: 2, label: 'Barqaror', description: 'Hissiyotlarni boshqara oladi.' },
                    { min: 3, max: 5, label: 'Hissiyotchang', description: 'Stressga moyil, sezgir.' },
                ],
            },
        },
    },
    {
        id: 'scale-5',
        name: '5 ta savol shkalada (1-5)',
        hint: 'Har bir savol 1-5; jami 5-25',
        instruction: {
            scoring: { method: 'sum', reverse: [] },
            interpretation: [
                { min: 5, max: 11, label: 'Past', description: '...' },
                { min: 12, max: 18, label: "O'rtacha", description: '...' },
                { min: 19, max: 25, label: 'Yuqori', description: '...' },
            ],
        },
    },
];
