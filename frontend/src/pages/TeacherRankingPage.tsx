import { useState } from 'react';
import { Trophy, Loader2, Medal, Crown, Star, Building2, Layers, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import {
    useTeacherRanking,
    useFacultyRanking,
    useKafedraRanking,
} from '@/hooks/useTeachers';
import { useGroups } from '@/hooks/useGroups';
import { useFaculties } from '@/hooks/useFaculties';
import { useKafedras } from '@/hooks/useKafedras';
import type { TeacherRankItem, FacultyRankItem, KafedraRankItem } from '@/services/teacherService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'teachers' | 'faculty' | 'kafedra';

const TABS: { value: Tab; label: string }[] = [
    { value: 'teachers', label: "O'qituvchilar reytingi" },
    { value: 'faculty',  label: "Fakultetlar reytingi" },
    { value: 'kafedra',  label: "Kafedralar reytingi" },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
};

const StarRating = ({ value }: { value: number }) => {
    const color =
        value >= 4.5 ? '#f59e0b'
      : value >= 3.5 ? '#fbbf24'
      : value >= 2.5 ? '#f97316'
      :                '#ef4444';
    return (
        <span className="inline-flex items-center gap-1 font-bold" style={{ color }}>
            <Star className="h-4 w-4 fill-current" />
            {value.toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground">/ 5</span>
        </span>
    );
};

const EmptyState = ({ label }: { label: string }) => (
    <div className="py-16 text-center text-muted-foreground">
        <Trophy className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p>{label}</p>
    </div>
);

const Spinner = () => (
    <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
);

// ─── Teacher filters ──────────────────────────────────────────────────────────
type Filters = { faculty_id?: number; kafedra_id?: number; group_id?: number };

const TeacherFilters = ({
    filters, onChange,
}: {
    filters: Filters;
    onChange: (f: Filters) => void;
}) => {
    const { data: facultyData } = useFaculties(1, 500, '');
    const { data: kafedraData } = useKafedras(1, 500, '');
    const { data: groupData } = useGroups(1, 500, '');

    const faculties = facultyData?.faculties ?? [];
    const kafedras = kafedraData?.kafedras ?? [];
    const groups = groupData?.groups ?? [];

    const hasFilters = filters.faculty_id || filters.kafedra_id || filters.group_id;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Faculty filter */}
            <div className="w-56">
                <Combobox
                    options={faculties.map((f) => ({ value: String(f.id), label: f.name }))}
                    value={filters.faculty_id ? String(filters.faculty_id) : ''}
                    onChange={(v) => onChange({ ...filters, faculty_id: v ? Number(v) : undefined })}
                    placeholder="Fakultet bo'yicha..."
                    searchPlaceholder="Fakultet qidirish..."
                />
            </div>
            {/* Kafedra filter */}
            <div className="w-56">
                <Combobox
                    options={kafedras.map((k) => ({ value: String(k.id), label: k.name }))}
                    value={filters.kafedra_id ? String(filters.kafedra_id) : ''}
                    onChange={(v) => onChange({ ...filters, kafedra_id: v ? Number(v) : undefined })}
                    placeholder="Kafedra bo'yicha..."
                    searchPlaceholder="Kafedra qidirish..."
                />
            </div>
            {/* Group filter */}
            <div className="w-48">
                <Combobox
                    options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                    value={filters.group_id ? String(filters.group_id) : ''}
                    onChange={(v) => onChange({ ...filters, group_id: v ? Number(v) : undefined })}
                    placeholder="Guruh bo'yicha..."
                    searchPlaceholder="Guruh qidirish..."
                />
            </div>
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({})}
                    className="gap-1 text-muted-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                    Tozalash
                </Button>
            )}
            {hasFilters && (
                <span className="text-xs text-muted-foreground">— filtrlangan</span>
            )}
        </div>
    );
};

// ─── Teacher table ────────────────────────────────────────────────────────────
const TeacherRankTable = ({ items }: { items: TeacherRankItem[] }) => {
    if (!items.length) return (
        <EmptyState label="Tanlangan filtr bo'yicha o'qituvchilar topilmadi." />
    );
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16 text-center">O'rin</TableHead>
                    <TableHead>O'qituvchi</TableHead>
                    <TableHead>Kafedra</TableHead>
                    <TableHead>Fakultet</TableHead>
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead className="text-right">O'rtacha baho</TableHead>
                    <TableHead className="text-right">Reyting ★</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.teacher_id} className={item.rank <= 3 ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center"><RankBadge rank={item.rank} /></TableCell>
                        <TableCell>
                            <div className="font-medium capitalize">{item.full_name}</div>
                            <div className="text-xs text-muted-foreground">{item.student_count} talaba</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.kafedra_name ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.faculty_name ?? '—'}</TableCell>
                        <TableCell className="text-right text-sm">{item.student_count}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{item.avg_grade.toFixed(2)}</TableCell>
                        <TableCell className="text-right"><StarRating value={item.weighted_rating} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ─── Faculty table ────────────────────────────────────────────────────────────
const FacultyRankTable = ({ items }: { items: FacultyRankItem[] }) => {
    if (!items.length) return <EmptyState label="Fakultetlar bo'yicha ma'lumotlar topilmadi." />;
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16 text-center">O'rin</TableHead>
                    <TableHead>Fakultet</TableHead>
                    <TableHead className="text-right">Kafedralar</TableHead>
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead className="text-right">O'rtacha baho</TableHead>
                    <TableHead className="text-right">Reyting ★</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.faculty_id} className={item.rank <= 3 ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center"><RankBadge rank={item.rank} /></TableCell>
                        <TableCell className="font-medium">{item.faculty_name}</TableCell>
                        <TableCell className="text-right text-sm">{item.kafedra_count}</TableCell>
                        <TableCell className="text-right text-sm">{item.student_count}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{item.avg_grade.toFixed(2)}</TableCell>
                        <TableCell className="text-right"><StarRating value={item.weighted_rating} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ─── Kafedra table ────────────────────────────────────────────────────────────
const KafedraRankTable = ({ items }: { items: KafedraRankItem[] }) => {
    if (!items.length) return <EmptyState label="Kafedralar bo'yicha ma'lumotlar topilmadi." />;
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16 text-center">O'rin</TableHead>
                    <TableHead>Kafedra</TableHead>
                    <TableHead>Fakultet</TableHead>
                    <TableHead className="text-right">O'qituvchilar</TableHead>
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead className="text-right">O'rtacha baho</TableHead>
                    <TableHead className="text-right">Reyting ★</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.kafedra_id} className={item.rank <= 3 ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center"><RankBadge rank={item.rank} /></TableCell>
                        <TableCell className="font-medium">{item.kafedra_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.faculty_name}</TableCell>
                        <TableCell className="text-right text-sm">{item.teacher_count}</TableCell>
                        <TableCell className="text-right text-sm">{item.student_count}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{item.avg_grade.toFixed(2)}</TableCell>
                        <TableCell className="text-right"><StarRating value={item.weighted_rating} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ─── Tab panels ───────────────────────────────────────────────────────────────
const TeachersPanel = () => {
    const [filters, setFilters] = useState<Filters>({});
    const { data, isLoading } = useTeacherRanking(
        Object.keys(filters).length ? filters : undefined
    );

    return (
        <div className="space-y-4">
            <TeacherFilters filters={filters} onChange={setFilters} />
            {isLoading ? <Spinner /> : <TeacherRankTable items={data?.teachers ?? []} />}
        </div>
    );
};

const FacultyPanel = () => {
    const { data, isLoading } = useFacultyRanking();
    if (isLoading) return <Spinner />;
    return <FacultyRankTable items={data?.faculties ?? []} />;
};

const KafedraPanel = () => {
    const { data, isLoading } = useKafedraRanking();
    if (isLoading) return <Spinner />;
    return <KafedraRankTable items={data?.kafedras ?? []} />;
};

// ─── Rating legend ────────────────────────────────────────────────────────────
const RatingLegend = () => (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Reyting shkalasi (2–5):</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> ≥ 4.5 — A'lo</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 3.5–4.5 — Yaxshi</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-orange-500 text-orange-500" /> 2.5–3.5 — Qoniqarli</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-red-500 text-red-500" /> &lt; 2.5 — Qoniqarsiz</span>
        <span className="ml-auto italic opacity-70">Bayes o'rtacha (C=5)</span>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const TeacherRankingPage = () => {
    const [tab, setTab] = useState<Tab>('teachers');

    return (
        <div className="space-y-5">
            <div>
                <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Reyting
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Talabalar bahosi bo'yicha reyting (2–5 shkalasi)
                </p>
            </div>

            <RatingLegend />

            <div className="flex flex-wrap gap-2">
                {TABS.map(({ value, label }) => (
                    <Button
                        key={value}
                        variant={tab === value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setTab(value)}
                    >
                        {value === 'faculty'  && <Building2 className="mr-1 h-3.5 w-3.5" />}
                        {value === 'kafedra'  && <Layers     className="mr-1 h-3.5 w-3.5" />}
                        {value === 'teachers' && <Trophy     className="mr-1 h-3.5 w-3.5" />}
                        {label}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {TABS.find((t) => t.value === tab)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {tab === 'teachers' && <TeachersPanel />}
                    {tab === 'faculty'  && <FacultyPanel />}
                    {tab === 'kafedra'  && <KafedraPanel />}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherRankingPage;
