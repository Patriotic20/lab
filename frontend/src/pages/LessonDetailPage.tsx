import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLesson, useLessonResults, useUpsertLessonResults } from '@/hooks/useLessons';
import { useGroupStudents } from '@/hooks/useGroups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import type { LessonAttendance, LessonResultUpsertItem } from '@/services/lessonService';

type Row = {
    user_id: number;
    full_name: string;
    attendance: LessonAttendance;
    grade: string;
    notes: string;
};

const ATTENDANCE_OPTIONS: { value: LessonAttendance; label: string }[] = [
    { value: 'present', label: 'Keldi' },
    { value: 'absent', label: 'Kelmadi' },
    { value: 'late', label: 'Kechikdi' },
];

export default function LessonDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const lessonId = id ? parseInt(id, 10) : undefined;

    const isAdmin = user?.roles?.some(r => r.name.toLowerCase() === 'admin');
    const isTeacher = user?.roles?.some(r => r.name.toLowerCase() === 'teacher');
    const canEdit = !!(isAdmin || isTeacher);

    const { data: lesson, isLoading: isLessonLoading } = useLesson(lessonId);
    const { data: studentsData } = useGroupStudents(lesson?.group_id);
    const { data: resultsData } = useLessonResults(lessonId);

    const upsertMutation = useUpsertLessonResults();

    const [rows, setRows] = useState<Row[]>([]);

    const studentList = useMemo(() => studentsData?.students ?? [], [studentsData]);
    const resultByUserId = useMemo(() => {
        const m = new Map<number, { attendance: LessonAttendance; grade: number | null; notes: string | null }>();
        (resultsData?.results ?? []).forEach(r => m.set(r.user_id, {
            attendance: r.attendance,
            grade: r.grade ?? null,
            notes: r.notes ?? null,
        }));
        return m;
    }, [resultsData]);

    useEffect(() => {
        if (!canEdit) return;
        const next: Row[] = studentList
            .filter(s => s.user_id != null)
            .map(s => {
                const existing = resultByUserId.get(s.user_id!);
                return {
                    user_id: s.user_id!,
                    full_name: s.full_name || `Talaba #${s.id}`,
                    attendance: existing?.attendance ?? 'present',
                    grade: existing?.grade != null ? String(existing.grade) : '',
                    notes: existing?.notes ?? '',
                };
            });
        setRows(next);
    }, [studentList, resultByUserId, canEdit]);

    const updateRow = (idx: number, patch: Partial<Row>) => {
        setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };

    const handleSave = () => {
        if (!lessonId) return;
        const items: LessonResultUpsertItem[] = rows.map(r => {
            const gradeNum = r.grade.trim() === '' ? null : parseInt(r.grade, 10);
            return {
                user_id: r.user_id,
                attendance: r.attendance,
                grade: gradeNum != null && !Number.isNaN(gradeNum) ? gradeNum : null,
                notes: r.notes.trim() || null,
            };
        });
        upsertMutation.mutate({ lessonId, items });
    };

    if (isLessonLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    if (!lesson) {
        return <p className="text-sm text-destructive">Dars topilmadi.</p>;
    }

    const studentResults = resultsData?.results ?? [];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/lessons')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Orqaga
                    </Button>
                    <h1 className="text-xl font-semibold tracking-tight">{lesson.topic}</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    {lesson.date}
                    {lesson.subject_teacher?.subject?.name ? ` · ${lesson.subject_teacher.subject.name}` : ''}
                    {lesson.group?.name ? ` · ${lesson.group.name}` : ''}
                </p>
                {lesson.description && (
                    <p className="text-sm text-foreground/80">{lesson.description}</p>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Natijalar</CardTitle>
                </CardHeader>
                <CardContent>
                    {canEdit ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>F.I.SH</TableHead>
                                        <TableHead className="w-[160px]">Qatnashish</TableHead>
                                        <TableHead className="w-[100px]">Baho (0-5)</TableHead>
                                        <TableHead>Izoh</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r, idx) => (
                                        <TableRow key={r.user_id}>
                                            <TableCell className="font-medium">{r.full_name}</TableCell>
                                            <TableCell>
                                                <select
                                                    value={r.attendance}
                                                    onChange={(e) => updateRow(idx, { attendance: e.target.value as LessonAttendance })}
                                                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                                                >
                                                    {ATTENDANCE_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={5}
                                                    value={r.grade}
                                                    onChange={(e) => updateRow(idx, { grade: e.target.value })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(idx, { notes: e.target.value })}
                                                    placeholder="Izoh..."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                Bu guruhda talabalar topilmadi.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {rows.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                                        {upsertMutation.isPending
                                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            : <Save className="h-4 w-4 mr-2" />}
                                        Saqlash
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Qatnashish</TableHead>
                                    <TableHead>Baho</TableHead>
                                    <TableHead>Izoh</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentResults.map(r => {
                                    const label = ATTENDANCE_OPTIONS.find(o => o.value === r.attendance)?.label ?? r.attendance;
                                    return (
                                        <TableRow key={r.id}>
                                            <TableCell>{label}</TableCell>
                                            <TableCell>{r.grade ?? '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{r.notes ?? '-'}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {studentResults.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            Hali natija qo'shilmagan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
