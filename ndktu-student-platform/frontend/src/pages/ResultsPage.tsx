import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '@/components/ui/Pagination';
import { useResults, useDeleteResult } from '@/hooks/useResults';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, FileText, X, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/utils';

import { useGroups } from '@/hooks/useGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useAuth } from '@/context/AuthContext';
import { resultService } from '@/services/resultService';

const ResultsPage = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    // Role detection — backend enforces access, this is only for UI decisions
    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const isAdmin = user?.roles?.some(role => role.name.toLowerCase() === 'admin');
    const isAdminOrTeacher = !isStudent;


    const { mutate: deleteResult, isPending: isDeleting } = useDeleteResult();
    const [resultToDelete, setResultToDelete] = useState<number | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setResultToDelete(id);
    };

    const handleConfirmDelete = () => {
        if (resultToDelete) {
            deleteResult(resultToDelete, {
                onSuccess: () => {
                    setResultToDelete(null);
                }
            });
        }
    };


    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [usernameSearch, setUsernameSearch] = useState<string>('');
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
    const [isExporting, setIsExporting] = useState(false);

    const parsedGroup = selectedGroup ? parseInt(selectedGroup, 10) : undefined;
    const parsedSubject = selectedSubject ? parseInt(selectedSubject, 10) : undefined;
    const parsedQuiz = selectedQuiz ? parseInt(selectedQuiz, 10) : undefined;
    const parsedGrade = selectedGrade ? parseInt(selectedGrade, 10) : undefined;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedGroup, selectedSubject, selectedQuiz, selectedGrade, usernameSearch, sortDir]);

    const { data: resultsData, isLoading: isResultsLoading } = useResults(
        currentPage, pageSize, undefined, parsedGrade, parsedGroup, parsedSubject, parsedQuiz, usernameSearch || undefined, sortDir,
        !isAuthLoading  // only run once auth is resolved
    );

    // Groups are scoped by backend: admins see all, teachers see only assigned groups
    const { data: groupsData } = useGroups(1, 1000, '');
    const { data: subjectsData } = useSubjects(1, 1000, '');
    const { data: quizzesData } = useQuizzes(1, 1000);

    const groups = groupsData?.groups || [];
    const subjectOptions = subjectsData?.subjects.map(s => ({ value: String(s.id), label: s.name })) || [];
    const quizOptions = quizzesData?.quizzes.map(q => ({ value: String(q.id), label: q.title })) || [];

    const results = resultsData?.results || [];
    const totalPages = resultsData ? Math.ceil(resultsData.total / pageSize) : 1;

    const handleClearFilters = () => {
        setSelectedGroup('');
        setSelectedSubject('');
        setSelectedQuiz('');
        setSelectedGrade('');
        setUsernameSearch('');
        setSortDir('desc');
        setCurrentPage(1);
    };

    const hasActiveFilters = !!(selectedGroup || selectedSubject || selectedQuiz || selectedGrade || usernameSearch || sortDir !== 'desc');

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const response = await resultService.getResults(
                1, 10000, parsedGrade, parsedGroup, parsedSubject, parsedQuiz, usernameSearch || undefined, sortDir
            );

            const items = response.results || [];
            if (items.length === 0) {
                alert("Eksport qilish uchun natijalar topilmadi.");
                return;
            }

            const { utils, writeFile } = await import('xlsx');
            const date = new Date().toLocaleDateString('uz-UZ').replace(/\//g, '.');

            const groupName = selectedGroup ? groups.find(g => g.id === parsedGroup)?.name || 'Tanlangan guruh' : 'Barcha guruhlar';
            const subjectName = selectedSubject ? subjectOptions.find(s => s.value === selectedSubject)?.label || 'Tanlangan fan' : 'Barcha fanlar';
            const quizName = selectedQuiz ? quizOptions.find(q => q.value === selectedQuiz)?.label || 'Tanlangan test' : 'Barcha testlar';

            const wsData: any[][] = [];
            wsData.push(["NKMU - Talabalar Natijalari", "", "", "", "", "", ""]);
            wsData.push([`Sana (Date): ${date}`, "", "", `Filtr Guruh: ${groupName}`, "", "", ""]);
            wsData.push([`Filtr Fan: ${subjectName}`, "", "", `Filtr Test: ${quizName}`, "", "", ""]);
            wsData.push(["", "", "", "", "", "", ""]);

            if (isAdminOrTeacher) {
                wsData.push(["ID", "Talaba", "Guruh", "Fan", "Test", "Ball", "To'g'ri / Jami", "Sana"]);
            } else {
                wsData.push(["ID", "Talaba", "Fan", "Test", "Ball", "To'g'ri / Jami", "Sana"]);
            }

            items.forEach((r) => {
                const dateStr = new Date(r.created_at).toLocaleString('uz-UZ', { hour12: false });
                const studentName = r.student_name || r.user?.username || `Foydalanuvchi ${r.user_id}`;
                const correctTotalStr = `${r.correct_answers} / ${(r.correct_answers || 0) + (r.wrong_answers || 0)}`;

                if (isAdminOrTeacher) {
                    wsData.push([
                        r.id,
                        studentName,
                        r.group?.name || '-',
                        r.subject?.name || '-',
                        r.quiz?.title || '-',
                        r.grade,
                        correctTotalStr,
                        dateStr
                    ]);
                } else {
                    wsData.push([
                        r.id,
                        studentName,
                        r.subject?.name || '-',
                        r.quiz?.title || '-',
                        r.grade,
                        correctTotalStr,
                        dateStr
                    ]);
                }
            });

            const ws = utils.aoa_to_sheet(wsData);

            if(!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
            ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } });
            ws['!merges'].push({ s: { r: 1, c: 3 }, e: { r: 1, c: 5 } });
            ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 2 } });
            ws['!merges'].push({ s: { r: 2, c: 3 }, e: { r: 2, c: 5 } });

            ws['!cols'] = isAdminOrTeacher ? [
                { wch: 10 }, { wch: 40 }, { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
            ] : [
                { wch: 10 }, { wch: 40 }, { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
            ];

            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Natijalar");
            writeFile(wb, `Natijalar_${date.replace(/\./g, '-')}.xlsx`);

        } catch (error) {
            console.error("Excel eksportda xatolik:", error);
            alert("Eksport qilishda xatolik yuz berdi.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Natijalar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Talabalar test natijalarini va baholarini ko'rish
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                            <label className="text-sm font-medium">Talaba ismi bo'yicha qidirish</label>
                            <Input
                                placeholder="Ism yoki foydalanuvchi nomini kiriting..."
                                value={usernameSearch}
                                onChange={(e) => setUsernameSearch(e.target.value)}
                            />
                        </div>

                        {/* Group filter — only for Admin / Teacher; backend scopes the list */}
                        {isAdminOrTeacher && (
                            <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                                <label className="text-sm font-medium">Guruh bo'yicha filtri</label>
                                <Combobox
                                    options={groups.map(g => ({ value: String(g.id), label: g.name }))}
                                    value={selectedGroup}
                                    onChange={(val) => setSelectedGroup(val || '')}
                                    placeholder="Barcha guruhlar"
                                    searchPlaceholder="Guruhni qidirish..."
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                            <label className="text-sm font-medium">Fan bo'yicha filtri</label>
                            <Combobox
                                options={subjectOptions}
                                value={selectedSubject}
                                onChange={setSelectedSubject}
                                placeholder="Barcha fanlar"
                                searchPlaceholder="Fanni qidirish..."
                            />
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                            <label className="text-sm font-medium">Test bo'yicha filtri</label>
                            <Combobox
                                options={quizOptions}
                                value={selectedQuiz}
                                onChange={setSelectedQuiz}
                                placeholder="Barcha testlar"
                                searchPlaceholder="Testni qidirish..."
                            />
                        </div>

                        <div className="flex flex-col gap-2 w-[160px]">
                            <label className="text-sm font-medium">Ball</label>
                            <Combobox
                                options={[
                                    { value: '5', label: "5 - A'lo" },
                                    { value: '4', label: "4 - Yaxshi" },
                                    { value: '3', label: "3 - Qoniqarli" },
                                    { value: '2', label: "2 - Qoniqarsiz" },
                                ]}
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                placeholder="Barcha ballar"
                                searchPlaceholder="Ballni qidirish..."
                            />
                        </div>

                        <div className="flex flex-col gap-2 w-[180px]">
                            <label className="text-sm font-medium">Sana bo'yicha</label>
                            <Combobox
                                options={[
                                    { value: 'desc', label: 'Oxirgi natijalar' },
                                    { value: 'asc', label: 'Eski natijalar' },
                                ]}
                                value={sortDir}
                                onChange={(val) => setSortDir(val as 'desc' | 'asc')}
                                placeholder="Saralash..."
                            />
                        </div>

                        {hasActiveFilters && (
                            <Button variant="ghost" className="mb-0.5" onClick={handleClearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Tozalash
                            </Button>
                        )}
                        <Button 
                            variant="primary"
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="w-full sm:w-auto ml-auto"
                        >
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                            Excel yuklab olish
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results table */}
            <Card>
                <CardContent>
                    {isResultsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p>Natijalar topilmadi.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Talaba</TableHead>
                                    {isAdminOrTeacher && <TableHead>Guruh</TableHead>}
                                    <TableHead>Fan</TableHead>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Ball</TableHead>
                                    <TableHead>To'g'ri / Jami</TableHead>
                                    <TableHead>Sana</TableHead>
                                    {isAdmin && <TableHead className="w-[80px]">Harakat</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((result) => (
                                    <TableRow
                                        key={result.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            if (result.user_id) params.set('user_id', String(result.user_id));
                                            if (result.quiz_id) params.set('quiz_id', String(result.quiz_id));
                                            navigate(`/results/answers?${params.toString()}`);
                                        }}
                                    >
                                        <TableCell>{result.id}</TableCell>
                                        <TableCell className="font-medium capitalize">
                                            <div>{result.student_name || result.user?.username || `Foydalanuvchi ${result.user_id}`}</div>
                                            {result.student_id && (
                                                <div className="text-xs text-muted-foreground normal-case">
                                                    ID: {result.student_id}
                                                </div>
                                            )}
                                        </TableCell>
                                        {isAdminOrTeacher && (
                                            <TableCell className="capitalize">{result.group?.name || '-'}</TableCell>
                                        )}
                                        <TableCell className="capitalize">{result.subject?.name || '-'}</TableCell>
                                        <TableCell className="capitalize">{result.quiz?.title || `Test ${result.quiz_id}`}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                                                result.grade == 5 
                                                    ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20"
                                                    : (result.grade >= 3)
                                                        ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20"
                                                        : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
                                            )}>
                                                {result.grade}
                                            </span>
                                        </TableCell>
                                        <TableCell>{result.correct_answers} / {result.correct_answers + result.wrong_answers}</TableCell>
                                        <TableCell>{new Date(result.created_at).toLocaleString(undefined, { hour12: false })}</TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    onClick={(e) => handleDeleteClick(e, result.id)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>


            <ConfirmDialog
                isOpen={resultToDelete !== null}
                onClose={() => setResultToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Natijani o'chirish"
                description="Haqiqatan ham ushbu natijani va unga tegishli barcha javoblarni o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="O'chirish"
                cancelText="Bekor qilish"
                isLoading={isDeleting}
                variant="danger"
            />


            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isResultsLoading}
            />
        </div>
    );
};

export default ResultsPage;
