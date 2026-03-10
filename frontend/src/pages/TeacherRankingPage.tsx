import { useState } from 'react';
import { Trophy, Loader2, Medal, Crown, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import {
    useTeacherRankingOverall,
    useTeacherRankingByFaculty,
    useTeacherRankingByKafedra,
    useTeacherRankingByGroup,
} from '@/hooks/useTeachers';
import { useFaculties, useKafedras } from '@/hooks/useReferenceData';
import { useGroups } from '@/hooks/useGroups';
import type { TeacherRankItem, RankingScope } from '@/services/teacherService';

// ─── Scope tabs ───────────────────────────────────────────────────────────────
const SCOPES: { value: RankingScope; label: string }[] = [
    { value: 'overall',  label: "Umumiy (Universitet)" },
    { value: 'faculty',  label: "Fakultet bo'yicha" },
    { value: 'kafedra',  label: "Kafedra bo'yicha" },
    { value: 'group',    label: "Guruh bo'yicha" },
];

// ─── Top-3 badge ──────────────────────────────────────────────────────────────
const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" aria-label="1-o'rin" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" aria-label="2-o'rin" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" aria-label="3-o'rin" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
};

// ─── Star rating cell (2–5 scale) ────────────────────────────────────────────
// Fill: ≥4.5 gold, ≥3.5 yellow, ≥2.5 orange, else red
const StarRating = ({ value }: { value: number }) => {
    const color =
        value >= 4.5 ? '#f59e0b'   // gold
      : value >= 3.5 ? '#fbbf24'   // yellow
      : value >= 2.5 ? '#f97316'   // orange
      :                '#ef4444';  // red

    return (
        <span className="inline-flex items-center gap-1 font-bold" style={{ color }}>
            <Star className="h-4 w-4 fill-current" />
            {value.toFixed(2)}
            <span className="text-xs font-normal text-muted-foreground">/ 5</span>
        </span>
    );
};

// ─── Ranking table ────────────────────────────────────────────────────────────
const RankingTable = ({ items, showGroup }: { items: TeacherRankItem[]; showGroup?: boolean }) => {
    if (items.length === 0) {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <Trophy className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>Ma'lumotlar topilmadi. O'qituvchilar uchun natijalar yo'q.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16 text-center">O'rin</TableHead>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Kafedra</TableHead>
                    <TableHead>Fakultet</TableHead>
                    {showGroup && <TableHead>Guruh</TableHead>}
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead className="text-right">O'rtacha baho</TableHead>
                    <TableHead className="text-right">Reyting ★</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow
                        key={item.teacher_id}
                        className={item.rank <= 3 ? 'bg-primary/5' : ''}
                    >
                        <TableCell className="text-center">
                            <RankBadge rank={item.rank} />
                        </TableCell>
                        <TableCell>
                            <div className="font-medium capitalize">{item.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                                {item.student_count} talaba
                            </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {item.kafedra_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {item.faculty_name ?? '—'}
                        </TableCell>
                        {showGroup && (
                            <TableCell className="text-sm text-muted-foreground">
                                {item.group_name ?? '—'}
                            </TableCell>
                        )}
                        <TableCell className="text-right text-sm">
                            {item.student_count}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                            {item.avg_grade.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                            <StarRating value={item.weighted_rating} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ─── Scope panels ─────────────────────────────────────────────────────────────
const OverallRanking = () => {
    const { data, isLoading } = useTeacherRankingOverall();
    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    return <RankingTable items={data?.teachers ?? []} />;
};

const FacultyRanking = () => {
    const { data: facData } = useFaculties();
    const faculties = facData?.faculties ?? [];
    const [facultyId, setFacultyId] = useState<number | undefined>();
    const { data, isLoading } = useTeacherRankingByFaculty(facultyId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-72">
                    <Combobox
                        options={faculties.map((f) => ({ value: String(f.id), label: f.name }))}
                        value={facultyId ? String(facultyId) : ''}
                        onChange={(v) => setFacultyId(v ? Number(v) : undefined)}
                        placeholder="Fakultetni tanlang..."
                        searchPlaceholder="Qidirish..."
                    />
                </div>
                {facultyId && <Button variant="ghost" size="sm" onClick={() => setFacultyId(undefined)}>Tozalash</Button>}
            </div>
            {!facultyId ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Reytingni ko'rish uchun fakultetni tanlang.</p>
            ) : isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <RankingTable items={data?.teachers ?? []} />
            )}
        </div>
    );
};

const KafedraRanking = () => {
    const { data: kafData } = useKafedras();
    const kafedras = kafData?.kafedras ?? [];
    const [kafedraId, setKafedraId] = useState<number | undefined>();
    const { data, isLoading } = useTeacherRankingByKafedra(kafedraId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-72">
                    <Combobox
                        options={kafedras.map((k) => ({ value: String(k.id), label: k.name }))}
                        value={kafedraId ? String(kafedraId) : ''}
                        onChange={(v) => setKafedraId(v ? Number(v) : undefined)}
                        placeholder="Kafedrani tanlang..."
                        searchPlaceholder="Qidirish..."
                    />
                </div>
                {kafedraId && <Button variant="ghost" size="sm" onClick={() => setKafedraId(undefined)}>Tozalash</Button>}
            </div>
            {!kafedraId ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Reytingni ko'rish uchun kafedrani tanlang.</p>
            ) : isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <RankingTable items={data?.teachers ?? []} />
            )}
        </div>
    );
};

const GroupRanking = () => {
    const { data: groupsData } = useGroups(1, 500, '');
    const groups = groupsData?.groups ?? [];
    const [groupId, setGroupId] = useState<number | undefined>();
    const { data, isLoading } = useTeacherRankingByGroup(groupId);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-72">
                    <Combobox
                        options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                        value={groupId ? String(groupId) : ''}
                        onChange={(v) => setGroupId(v ? Number(v) : undefined)}
                        placeholder="Guruhni tanlang..."
                        searchPlaceholder="Qidirish..."
                    />
                </div>
                {groupId && <Button variant="ghost" size="sm" onClick={() => setGroupId(undefined)}>Tozalash</Button>}
            </div>
            {!groupId ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Reytingni ko'rish uchun guruhni tanlang.</p>
            ) : isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <RankingTable items={data?.teachers ?? []} showGroup />
            )}
        </div>
    );
};

// ─── Legend card ──────────────────────────────────────────────────────────────
const RatingLegend = () => (
    <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Reyting shkalasi:</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> ≥ 4.5 — A'lo</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 3.5–4.5 — Yaxshi</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-orange-500 text-orange-500" /> 2.5–3.5 — Qoniqarli</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-red-500 text-red-500" /> &lt; 2.5 — Qoniqarsiz</span>
        <span className="ml-auto italic">Reyting = Bayes o'rtacha (C=5, global o'rtacha)</span>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const TeacherRankingPage = () => {
    const [scope, setScope] = useState<RankingScope>('overall');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    O'qituvchilar reytingi
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Talabalar bahosi bo'yicha o'qituvchilar reytingi (1–5 shkalasi)
                </p>
            </div>

            <RatingLegend />

            {/* Scope tabs */}
            <div className="flex gap-2 flex-wrap">
                {SCOPES.map(({ value, label }) => (
                    <Button
                        key={value}
                        variant={scope === value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setScope(value)}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {SCOPES.find((s) => s.value === scope)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {scope === 'overall'  && <OverallRanking />}
                    {scope === 'faculty'  && <FacultyRanking />}
                    {scope === 'kafedra'  && <KafedraRanking />}
                    {scope === 'group'    && <GroupRanking />}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherRankingPage;
