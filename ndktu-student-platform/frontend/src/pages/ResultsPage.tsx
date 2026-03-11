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
import { Loader2, FileText, X, ArrowLeft, Users, ChevronRight } from 'lucide-react';
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

    const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');
    const isTeacher = user?.roles?.some(role => role.name.toLowerCase() === 'teacher');

    const [viewMode, setViewMode] = useState<'groups' | 'results'>('groups');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Once auth resolves, students go directly to results view
    useEffect(() => {
        if (!isAuthLoading && isStudent) {
            setViewMode('results');
        }
    }, [isAuthLoading, isStudent]);

    // For student: filter results to their own data
    const userId = isStudent ? user?.id : undefined;

    // group_teachers.teacher_id = users.id
    const groupTeacherId = isTeacher ? user?.id : undefined;
    // subject_teachers.teacher_id = teachers.id (the Teacher row id, not User.id)
    const subjectTeacherId = isTeacher ? user?.teacher?.id : undefined;

    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [searchGroup, setSearchGroup] = useState<string>('');

    const parsedGroup = selectedGroup ? parseInt(selectedGroup, 10) : undefined;
    const parsedSubject = selectedSubject ? parseInt(selectedSubject, 10) : undefined;
    const parsedQuiz = selectedQuiz ? parseInt(selectedQuiz, 10) : undefined;
    const parsedGrade = selectedGrade ? parseInt(selectedGrade, 10) : undefined;

    const { data: resultsData, isLoading: isResultsLoading } = useResults(
        currentPage, pageSize, userId, parsedGrade, parsedGroup, parsedSubject, parsedQuiz,
        !isAuthLoading  // only run query once auth is resolved
    );

    // Groups: scoped to teacher's assigned groups when logged in as teacher
    const { data: groupsData, isLoading: isGroupsLoading } = useGroups(1, 100, '', groupTeacherId);
    // Subjects: backend auto-filters by current user's role; also pass teacher_id for optional explicit filter
    const { data: subjectsData } = useSubjects(1, 100, '', subjectTeacherId);
    const { data: quizzesData } = useQuizzes(1, 100);

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
        setCurrentPage(1);
    };

    const handleGroupClick = (groupId: number) => {
        setSelectedGroup(String(groupId));
        setViewMode('results');
        setCurrentPage(1);
    };

    const handleBackToGroups = () => {
        setSelectedGroup('');
        handleClearFilters();
        setViewMode('groups');
        setCurrentPage(1);
    };

    const handleRowClick = (result: typeof results[0]) => {
        const params = new URLSearchParams();
        if (result.user_id) params.set('user_id', String(result.user_id));
        if (result.quiz_id) params.set('quiz_id', String(result.quiz_id));
        navigate(`/results/answers?${params.toString()}`);
    };

    if (viewMode === 'groups' && !isStudent) {
        const activeGroups = groups.filter((group) =>
            group.name.toLowerCase().includes(searchGroup.toLowerCase())
        );
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Natijalar</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Guruhni tanlang</p>
                    </div>
                    <div className="w-full sm:w-64">
                        <Input
                            placeholder="Guruhni qidirish..."
                            value={searchGroup}
                            onChange={(e) => setSearchGroup(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isGroupsLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : activeGroups.length === 0 ? (
                            <div className="flex justify-center p-8 text-muted-foreground">
                                Guruhlar topilmadi.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {activeGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => handleGroupClick(group.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-2 rounded-md">
                                                <Users className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{group.name}</h3>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {!isStudent && (
                    <Button variant="outline" size="icon" onClick={handleBackToGroups}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        {!isStudent ? (groups.find(g => g.id === parsedGroup)?.name || 'Natijalar') : 'Natijalar'}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Talabalar test natijalarini va baholarini ko'rish</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Group filter — visible for admin/teacher in results view */}
                        {!isStudent && (
                            <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                                <label className="text-sm font-medium">Guruh bo'yicha filtri</label>
                                <Combobox
                                    options={groups.map(g => ({ value: String(g.id), label: g.name }))}
                                    value={selectedGroup}
                                    onChange={(val) => {
                                        setSelectedGroup(val || '');
                                        setCurrentPage(1);
                                    }}
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
                        {(selectedGroup || selectedSubject || selectedQuiz || selectedGrade) && (
                            <Button variant="ghost" className="mb-0.5" onClick={handleClearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Tozalash
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

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
                                    <TableHead>Fan</TableHead>
                                    {!isStudent && <TableHead>Guruh</TableHead>}
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
                                        onClick={() => handleRowClick(result)}
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
                                        <TableCell className="capitalize">{result.subject?.name || '-'}</TableCell>
                                        {!isStudent && <TableCell className="capitalize">{result.group?.name || '-'}</TableCell>}
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
                                        <TableCell>{new Date(result.created_at).toLocaleDateString()}</TableCell>
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
