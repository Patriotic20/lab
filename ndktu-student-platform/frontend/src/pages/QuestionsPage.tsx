import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useNavigate } from 'react-router-dom';
import type { Question } from '@/services/questionService';
import type { Subject } from '@/services/subjectService';
import { Button } from '@/components/ui/Button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, FileQuestion, Upload, FileUp, Search, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useQuestions, useDeleteQuestion, useUploadQuestions } from '@/hooks/useQuestions';
import { useSubjects, useTeacherAssignedSubjects } from '@/hooks/useSubjects';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

// ─── Teacher Subject Picker ──────────────────────────────────────────────────

const TeacherSubjectPicker = ({ onSelect }: { onSelect: (subject: Subject) => void }) => {
    const { user } = useAuth();
    const userId = user?.id;
    const { data, isLoading } = useTeacherAssignedSubjects(userId);
    const subjects = data?.subject_teachers.map((st) => st.subject) || [];

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (subjects.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Fanlar biriktirilmagan</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                        Hozircha sizga hech qanday fan biriktirilmagan. Admin bilan bog'laning.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
                <Card
                    key={subject.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => onSelect(subject)}
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                            <span>{subject.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardTitle>
                        <CardDescription>Savollarni ko'rish uchun bosing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>Savollar bankini ko'rish</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// ─── Questions Table (shared by admin and teacher) ───────────────────────────

interface QuestionsTableProps {
    subjectId?: number;
    subjects: Subject[];
    onBack?: () => void;
    selectedSubjectName?: string;
}

const QuestionsTable = ({ subjectId, subjects, onBack, selectedSubjectName }: QuestionsTableProps) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page when switching subject
    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
        setDebouncedSearch('');
    }, [subjectId]);

    const { data: questionsData, isLoading: isQuestionsLoading } = useQuestions(
        currentPage,
        pageSize,
        debouncedSearch,
        subjectId,
    );
    const deleteQuestionMutation = useDeleteQuestion();

    const questions = questionsData?.questions || [];
    const totalPages = questionsData ? Math.ceil(questionsData.total / pageSize) : 1;

    const handleCreateQuestion = () => navigate('/questions/create');

    const handleEditQuestion = (question: Question, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/questions/${question.id}/edit`);
    };

    const handleDeleteClick = (question: Question, e: React.MouseEvent) => {
        e.stopPropagation();
        setQuestionToDelete(question);
        setIsDeleteModalOpen(true);
    };

    const handleViewQuestion = (question: Question) => {
        setSelectedQuestion(question);
        setIsDetailModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!questionToDelete) return;
        deleteQuestionMutation.mutate(questionToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setQuestionToDelete(null);
            },
        });
    };

    const getSubjectName = (id?: number) => subjects.find(s => s.id === id)?.name || '-';

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Orqaga
                        </Button>
                    )}
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            {selectedSubjectName ? `Savollar — ${selectedSubjectName}` : 'Savollar'}
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Savollar bankini boshqarish</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Qidirish..."
                            className="pl-8 w-[220px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Excel import
                    </Button>
                    <Button onClick={handleCreateQuestion}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent>
                    {isQuestionsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileQuestion className="h-12 w-12 mb-4 opacity-20" />
                            <p>Savollar topilmadi. Qo'lda qo'shing yoki Excel dan import qiling.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50%]">Savol</TableHead>
                                    <TableHead>Fan</TableHead>
                                    <TableHead>Foydalanuvchi</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.map((question) => {
                                    const plainText = stripHtml(question.text);
                                    return (
                                        <TableRow
                                            key={question.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleViewQuestion(question)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="break-words max-w-md" title={plainText}>
                                                    {plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText}
                                                </div>
                                            </TableCell>
                                            <TableCell>{question.subject_name || '-'}</TableCell>
                                            <TableCell>{question.username || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleEditQuestion(question, e)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={(e) => handleDeleteClick(question, e)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isQuestionsLoading}
            />

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => setIsUploadModalOpen(false)}
                subjects={subjects}
                defaultSubjectId={subjectId}
            />

            <QuestionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                question={selectedQuestion}
                getSubjectName={getSubjectName}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Savolni o'chirish"
                description="Haqiqatan ham bu savolni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const QuestionsPage = () => {
    const { user } = useAuth();
    const isTeacher = user?.roles?.some(r => r.name.toLowerCase() === 'teacher');

    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // All subjects — needed for admin flat view and upload modal
    const { data: subjectsData } = useSubjects(1, 100);
    const subjects = subjectsData?.subjects || [];

    if (isTeacher) {
        if (!selectedSubject) {
            // Step 1: show subject picker
            return (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Savollar</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Fan tanlang — o'sha fanga tegishli savollarni ko'rasiz
                        </p>
                    </div>
                    <TeacherSubjectPicker onSelect={setSelectedSubject} />
                </div>
            );
        }

        // Step 2: show questions filtered by selected subject
        return (
            <QuestionsTable
                subjectId={selectedSubject.id}
                subjects={subjects}
                selectedSubjectName={selectedSubject.name}
                onBack={() => setSelectedSubject(null)}
            />
        );
    }

    // Admin: existing flat list
    return <QuestionsTable subjects={subjects} />;
};

// ─── Modals ───────────────────────────────────────────────────────────────────

const QuestionDetailModal = ({
    isOpen,
    onClose,
    question,
    getSubjectName,
}: {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    getSubjectName: (id?: number) => string;
}) => {
    if (!question) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Savol tafsilotlari">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Savol matni</h3>
                    <div
                        className="rounded-lg border bg-muted/50 p-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: question.text }}
                    />
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Variantlar</h3>
                    <div className="grid gap-3">
                        {[
                            { label: 'A', value: question.option_a },
                            { label: 'B', value: question.option_b },
                            { label: 'C', value: question.option_c },
                            { label: 'D', value: question.option_d },
                        ].map((option) => (
                            <div key={option.label} className="flex gap-3 items-start">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    {option.label}
                                </div>
                                <div
                                    className="w-full rounded-lg border p-3 text-sm min-h-[3rem]"
                                    dangerouslySetInnerHTML={{ __html: option.value }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t mt-4">
                    <p className="text-sm text-muted-foreground">
                        Fan: <span className="font-medium text-foreground">{getSubjectName(question.subject_id)}</span>
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onClose}>Yopish</Button>
                </div>
            </div>
        </Modal>
    );
};

const UploadModal = ({
    isOpen,
    onClose,
    onSuccess,
    subjects,
    defaultSubjectId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subjects: Subject[];
    defaultSubjectId?: number;
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [subjectId, setSubjectId] = useState<string>(defaultSubjectId ? String(defaultSubjectId) : '');
    const uploadMutation = useUploadQuestions();

    // Sync defaultSubjectId when it changes (e.g., navigating between subjects)
    useEffect(() => {
        setSubjectId(defaultSubjectId ? String(defaultSubjectId) : '');
    }, [defaultSubjectId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file || !subjectId) return;
        uploadMutation.mutate({ file, subject_id: parseInt(subjectId) }, {
            onSuccess: () => onSuccess(),
            onError: () => alert("Faylni yuklashda xatolik yuz berdi"),
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Excel dan savollar import qilish">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fan</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                    >
                        <option value="">Fan tanlang</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-10">
                    <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                        Excel fayl (.xlsx) tanlang
                    </p>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-violet-50 file:text-violet-700
                        hover:file:bg-violet-100"
                    />
                </div>
                {file && (
                    <div className="text-sm">
                        Tanlangan fayl: <span className="font-medium">{file.name}</span>
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleUpload} isLoading={uploadMutation.isPending} disabled={!file || !subjectId}>
                        Yuklash
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default QuestionsPage;
