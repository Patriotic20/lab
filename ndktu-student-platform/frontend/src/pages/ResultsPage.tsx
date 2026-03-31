import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '@/components/ui/Pagination';
import { useResults } from '@/hooks/useResults';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, FileText, X } from 'lucide-react';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { useGroups } from '@/hooks/useGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useAuth } from '@/context/AuthContext';

const ResultsPage = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    // Role detection — backend enforces access, this is only for UI decisions
    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const isAdminOrTeacher = !isStudent;

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [usernameSearch, setUsernameSearch] = useState<string>('');
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

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

                        <div className="flex flex-col gap-2 w-[120px]">
                            <label className="text-sm font-medium">Ball</label>
                            <Input
                                type="number"
                                placeholder="..."
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                min={1}
                                max={5}
                            />
                        </div>

                        <div className="flex flex-col gap-2 w-[150px]">
                            <label className="text-sm font-medium">Sana bo'yicha</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={sortDir}
                                onChange={(e) => setSortDir(e.target.value as 'desc' | 'asc')}
                            >
                                <option value="desc">Oxirgi natijalar</option>
                                <option value="asc">Eski natijalar</option>
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <Button variant="ghost" className="mb-0.5" onClick={handleClearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Tozalash
                            </Button>
                        )}
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
                                            <span className={
                                                result.grade == 5 ? "text-green-600 font-medium" :
                                                    (result.grade == 4 || result.grade == 3) ? "text-yellow-600" :
                                                        "text-red-600"
                                            }>
                                                {result.grade}
                                            </span>
                                        </TableCell>
                                        <TableCell>{result.correct_answers} / {result.correct_answers + result.wrong_answers}</TableCell>
                                        <TableCell>{new Date(result.created_at).toLocaleString(undefined, { hour12: false })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
