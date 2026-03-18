import { useState } from 'react';
import { Trophy, Loader2, Medal, Crown, Building2, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import {
    useTeacherRanking,
    useFacultyRanking,
    useKafedraRanking,
} from '@/hooks/useTeachers';
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


// ─── Teacher table ────────────────────────────────────────────────────────────
const TeacherRankTable = ({ items }: { items: TeacherRankItem[] }) => {
    if (!items.length) return (
        <EmptyState label="Hozircha o'qituvchilar bo'yicha ma'lumotlar mavjud emas." />
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
                        <TableCell className="text-right text-sm font-medium tabular-nums">{item.avg_grade.toFixed(2)}</TableCell>
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
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.faculty_id} className={item.rank <= 3 ? 'bg-primary/5' : ''}>
                        <TableCell className="text-center"><RankBadge rank={item.rank} /></TableCell>
                        <TableCell className="font-medium">{item.faculty_name}</TableCell>
                        <TableCell className="text-right text-sm">{item.kafedra_count}</TableCell>
                        <TableCell className="text-right text-sm">{item.student_count}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">{item.avg_grade.toFixed(2)}</TableCell>
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
                        <TableCell className="text-right text-sm font-medium tabular-nums">{item.avg_grade.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ─── Tab panels ───────────────────────────────────────────────────────────────
const TeachersPanel = () => {
    const { data, isLoading } = useTeacherRanking();
    if (isLoading) return <Spinner />;
    return <TeacherRankTable items={data?.teachers ?? []} />;
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
                    Talabalar bahosi bo'yicha umumiy reyting
                </p>
            </div>


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