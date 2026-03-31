import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Teacher } from '@/services/teacherService';
import { Button } from '@/components/ui/Button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loader2, Search, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Combobox } from '@/components/ui/Combobox';
import { useTeachers, useCreateTeacherWithUser, useUpdateTeacher, useDeleteTeacher, useAssignGroups, useAssignSubjects } from '@/hooks/useTeachers';
import type { TeacherFullCreateRequest } from '@/services/teacherService';
import { useKafedras } from '@/hooks/useReferenceData';
import { useUsers } from '@/hooks/useUsers';
import { useGroups } from '@/hooks/useGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useForm } from 'react-hook-form';
import { useQuestions, useDeleteQuestion, useBulkDeleteQuestions } from '@/hooks/useQuestions';
import { useNavigate } from 'react-router-dom';
import type { Question } from '@/services/questionService';
import { FileQuestion, BookOpen, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const teacherCreateSchema = z.object({
    first_name: z.string().min(1, 'Ism kiritilishi shart'),
    last_name: z.string().min(1, 'Familiya kiritilishi shart'),
    third_name: z.string().min(1, 'Otasining ismi kiritilishi shart'),
    kafedra_id: z.number().min(1, 'Kafedra tanlanishi shart'),
    username: z.string().min(3, 'Minimum 3 ta belgi'),
    password: z.string().min(4, 'Minimum 4 ta belgi'),
});

const teacherUpdateSchema = z.object({
    first_name: z.string().min(1, 'Ism kiritilishi shart'),
    last_name: z.string().min(1, 'Familiya kiritilishi shart'),
    third_name: z.string().min(1, 'Otasining ismi kiritilishi shart'),
    kafedra_id: z.number().min(1, 'Kafedra tanlanishi shart'),
    user_id: z.number().min(1, 'Foydalanuvchi tanlanishi shart'),
});

type TeacherCreateFormValues = z.infer<typeof teacherCreateSchema>;
type TeacherUpdateFormValues = z.infer<typeof teacherUpdateSchema>;

const TeachersPage = () => {
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [cascadeWarnings, setCascadeWarnings] = useState<string[]>([]);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [teacherToAssign, setTeacherToAssign] = useState<Teacher | null>(null);

    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: teachersData, isLoading: isTeachersLoading } = useTeachers(currentPage, pageSize, debouncedSearch);
    const deleteTeacherMutation = useDeleteTeacher();

    const teachers = teachersData?.teachers || [];
    const totalPages = teachersData ? Math.ceil(teachersData.total / pageSize) : 1;

    const handleViewTeacher = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setViewMode('detail');
    };

    const handleBackToList = () => {
        setSelectedTeacher(null);
        setViewMode('list');
    };

    const handleEditClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setTeacherToDelete(teacher);
        setCascadeWarnings([]);
        setIsDeleteModalOpen(true);
    };

    const handleAssignGroupsClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setTeacherToAssign(teacher);
        setIsGroupModalOpen(true);
    };

    const handleAssignSubjectsClick = (teacher: Teacher, e: React.MouseEvent) => {
        e.stopPropagation();
        setTeacherToAssign(teacher);
        setIsSubjectModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!teacherToDelete) return;
        deleteTeacherMutation.mutate({ id: teacherToDelete.id, force: cascadeWarnings.length > 0 }, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setTeacherToDelete(null);
                setCascadeWarnings([]);
            },
            onError: (error: any) => {
                if (error.response?.status === 409 && error.response?.data?.detail?.requires_confirmation) {
                    setCascadeWarnings(error.response.data.detail.warnings || []);
                } else {
                    alert("O'chirishda xatolik yuz berdi");
                    setIsDeleteModalOpen(false);
                    setTeacherToDelete(null);
                    setCascadeWarnings([]);
                }
            }
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        setSelectedTeacher(null);
    };

    if (viewMode === 'detail' && selectedTeacher) {
        return <TeacherDetail teacher={selectedTeacher} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">O'qituvchilar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">O'qituvchilar ro'yxati va ma'lumotlarini boshqarish</p>
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
                    <Button onClick={() => { setSelectedTeacher(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isTeachersLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>F.I.SH / Kafedra</TableHead>
                                    <TableHead>Foydalanuvchi</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map((teacher) => (
                                    <TableRow
                                        key={teacher.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleViewTeacher(teacher)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="capitalize">{teacher.full_name || teacher.user?.username || 'Noma\'lum'}</div>
                                            {teacher.kafedra && (
                                                <div className="text-xs text-muted-foreground capitalize">
                                                    {teacher.kafedra?.name}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{teacher.user?.username || '-'}</TableCell>
                                        <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => handleAssignGroupsClick(teacher, e)}>
                                                    Guruhlar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={(e) => handleAssignSubjectsClick(teacher, e)}>
                                                    Fanlar
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(teacher, e)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={(e) => handleDeleteClick(teacher, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {teachers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">O'qituvchilar topilmadi.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isTeachersLoading}
            />

            <TeacherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teacher={selectedTeacher}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setCascadeWarnings([]); setTeacherToDelete(null); }}
                onConfirm={handleConfirmDelete}
                title="O'qituvchini o'chirish"
                description={
                    cascadeWarnings.length > 0 ? (
                        <div className="space-y-2 mt-2 text-left">
                            <p className="text-red-600 font-medium">Diqqat! Ushbu o'qituvchini o'chirish quyidagi ma'lumotlarni ham o'chiradi:</p>
                            <ul className="list-disc pl-5 text-sm text-red-500">
                                {cascadeWarnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                            <p className="font-semibold text-red-700 mt-2">Tasdiqlaysizmi? Bu amalni bekor qilib bo'lmaydi!</p>
                        </div>
                    ) : `Siz haqiqatan ham "${teacherToDelete?.full_name}" o'qituvchisini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`
                }
                confirmText={cascadeWarnings.length > 0 ? "Ha, majburiy o'chirish" : "O'chirish"}
                cancelText="Bekor qilish"
            />

            <TeacherGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                teacher={teacherToAssign}
            />

            <TeacherSubjectModal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                teacher={teacherToAssign}
            />
        </div>
    );
};

const TeacherDetail = ({ teacher, onBack }: { teacher: Teacher; onBack: () => void }) => {
    const [selectedSubject, setSelectedSubject] = useState<{id: number, name: string} | null>(null);

    if (selectedSubject) {
        return (
            <TeacherQuestionsList 
                teacher={teacher} 
                subject={selectedSubject} 
                onBack={() => setSelectedSubject(null)} 
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Orqaga
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{teacher.full_name || `O'qituvchi #${teacher.id}`}</h1>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">F.I.SH:</span>
                            <span>{teacher.full_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Ism:</span>
                            <span>{teacher.first_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Familiya:</span>
                            <span>{teacher.last_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Otasining ismi:</span>
                            <span>{teacher.third_name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Foydalanuvchi:</span>
                            <span>{teacher.user?.username || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Kafedra ma'lumotlari</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Kafedra:</span>
                            <span>{teacher.kafedra?.name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <span className="font-semibold text-muted-foreground">Fakultet ID:</span>
                            <span>{teacher.kafedra?.faculty_id || '-'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Biriktirilgan fanlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teacher.subject_teachers && teacher.subject_teachers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {teacher.subject_teachers.map(st => (
                                    <div 
                                        key={st.subject_id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer group transition-colors"
                                        onClick={() => setSelectedSubject({ id: st.subject_id, name: st.subject?.name || `ID: ${st.subject_id}` })}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span>{st.subject?.name || `ID: ${st.subject_id}`}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">Biriktirilgan fanlar yo'q.</span>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Biriktirilgan guruhlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teacher.user?.group_teachers && teacher.user.group_teachers.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {teacher.user.group_teachers.map(gt => (
                                    <li key={gt.group_id}>{gt.group?.name || `ID: ${gt.group_id}`}</li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-sm text-muted-foreground">Biriktirilgan guruhlar yo'q.</span>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const TeacherQuestionsList = ({ 
    teacher, 
    subject, 
    onBack 
}: { 
    teacher: Teacher; 
    subject: {id: number, name: string}; 
    onBack: () => void 
}) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: questionsData, isLoading: isQuestionsLoading } = useQuestions(
        currentPage,
        pageSize,
        debouncedSearch,
        subject.id,
        teacher.user_id, // Filter by teacher's user
    );

    const deleteQuestionMutation = useDeleteQuestion();
    const bulkDeleteMutation = useBulkDeleteQuestions();

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

    const handleBulkDelete = () => {
        if (window.confirm(`Haqiqatan ham "${subject.name}" faniga va ushbu o'qituvchiga tegishli BARCHA savollarni o'chirmoqchimisiz?`)) {
            bulkDeleteMutation.mutate({ 
                subject_id: subject.id, 
                user_id: teacher.user_id 
            }, {
                onSuccess: (data: any) => {
                    alert(`${data.deleted_count} ta savol o'chirildi`);
                },
                onError: () => alert("Savollarni o'chirishda xatolik yuz berdi"),
            });
        }
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Orqaga
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            {teacher.full_name} — {subject.name}
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Savollar ro'yxati</p>
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
                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Barcha savollarni o'chirish
                    </Button>
                    <Button onClick={handleCreateQuestion}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isQuestionsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                            <FileQuestion className="h-12 w-12 mb-4 opacity-20" />
                            <p>Ushbu fan va o'qituvchi uchun savollar mavjud emas.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[70%]">Savol</TableHead>
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
                                                <div className="break-words max-w-2xl" title={plainText}>
                                                    {plainText.length > 150 ? `${plainText.substring(0, 150)}...` : plainText}
                                                </div>
                                            </TableCell>
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

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Savolni o'chirish"
                description="Haqiqatan ham bu savolni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />

            <QuestionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                question={selectedQuestion}
                subjectName={subject.name}
            />
        </div>
    );
};

const QuestionDetailModal = ({
    isOpen,
    onClose,
    question,
    subjectName,
}: {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    subjectName: string;
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
                        Fan: <span className="font-medium text-foreground">{subjectName}</span>
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onClose}>Yopish</Button>
                </div>
            </div>
        </Modal>
    );
};

const TeacherModal = ({ isOpen, onClose, teacher, onSuccess }: {
    isOpen: boolean; onClose: () => void; teacher: Teacher | null; onSuccess: () => void;
}) => {
    const { data: kafedrasData } = useKafedras();
    const { data: usersData } = useUsers(1, 100);
    const kafedras = kafedrasData?.kafedras || [];
    const users = usersData?.users || [];

    // --- CREATE form ---
    const createForm = useForm<TeacherCreateFormValues>({
        resolver: zodResolver(teacherCreateSchema),
        defaultValues: { first_name: '', last_name: '', third_name: '', kafedra_id: 0, username: '', password: '' },
    });

    // --- UPDATE form ---
    const updateForm = useForm<TeacherUpdateFormValues>({
        resolver: zodResolver(teacherUpdateSchema),
        defaultValues: { first_name: '', last_name: '', third_name: '', kafedra_id: 0, user_id: 0 },
    });

    const createMutation = useCreateTeacherWithUser();
    const updateMutation = useUpdateTeacher();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const selectedKafedraIdCreate = createForm.watch('kafedra_id');
    const selectedKafedraIdUpdate = updateForm.watch('kafedra_id');
    const selectedUserId = updateForm.watch('user_id');

    useEffect(() => {
        if (teacher) {
            updateForm.reset({
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                third_name: teacher.third_name,
                kafedra_id: teacher.kafedra_id,
                user_id: teacher.user_id,
            });
        } else {
            createForm.reset({ first_name: '', last_name: '', third_name: '', kafedra_id: 0, username: '', password: '' });
        }
    }, [teacher, isOpen]);

    const onCreateSubmit = (data: TeacherCreateFormValues) => {
        createMutation.mutate(data as TeacherFullCreateRequest, {
            onSuccess: () => onSuccess(),
            onError: (err: any) => alert(err?.response?.data?.detail || "O'qituvchi yaratishda xatolik"),
        });
    };

    const onUpdateSubmit = (data: TeacherUpdateFormValues) => {
        updateMutation.mutate({ id: teacher!.id, data }, {
            onSuccess: () => onSuccess(),
            onError: () => alert("O'qituvchini yangilashda xatolik"),
        });
    };

    if (!teacher) {
        // ── CREATE MODE ──
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="O'qituvchi yaratish">
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <Input label="Familiya" {...createForm.register('last_name')} error={createForm.formState.errors.last_name?.message} placeholder="Familiyani kiriting" />
                    <Input label="Ism" {...createForm.register('first_name')} error={createForm.formState.errors.first_name?.message} placeholder="Ismni kiriting" />
                    <Input label="Otasining ismi" {...createForm.register('third_name')} error={createForm.formState.errors.third_name?.message} placeholder="Otasining ismini kiriting" />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Kafedra</label>
                        <Combobox
                            options={kafedras.map(k => ({ value: k.id.toString(), label: k.name }))}
                            value={selectedKafedraIdCreate ? selectedKafedraIdCreate.toString() : ""}
                            onChange={(val) => createForm.setValue('kafedra_id', val ? Number(val) : 0)}
                            placeholder="Kafedrani tanlang..."
                            searchPlaceholder="Kafedrani qidirish..."
                        />
                        {createForm.formState.errors.kafedra_id && (
                            <p className="mt-1 text-xs text-destructive">{createForm.formState.errors.kafedra_id.message}</p>
                        )}
                    </div>
                    <Input label="Username" {...createForm.register('username')} error={createForm.formState.errors.username?.message} placeholder="Loginni kiriting" autoComplete="off" />
                    <Input label="Parol" type="password" {...createForm.register('password')} error={createForm.formState.errors.password?.message} placeholder="Parolni kiriting" autoComplete="new-password" />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                        <Button type="submit" isLoading={isSubmitting}>Yaratish</Button>
                    </div>
                </form>
            </Modal>
        );
    }

    // ── EDIT MODE ──
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="O'qituvchini tahrirlash">
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <Input label="Familiya" {...updateForm.register('last_name')} error={updateForm.formState.errors.last_name?.message} placeholder="Familiyani kiriting" />
                <Input label="Ism" {...updateForm.register('first_name')} error={updateForm.formState.errors.first_name?.message} placeholder="Ismni kiriting" />
                <Input label="Otasining ismi" {...updateForm.register('third_name')} error={updateForm.formState.errors.third_name?.message} placeholder="Otasining ismini kiriting" />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Kafedra</label>
                    <Combobox
                        options={kafedras.map(k => ({ value: k.id.toString(), label: k.name }))}
                        value={selectedKafedraIdUpdate ? selectedKafedraIdUpdate.toString() : ""}
                        onChange={(val) => updateForm.setValue('kafedra_id', val ? Number(val) : 0)}
                        placeholder="Kafedrani tanlang..."
                        searchPlaceholder="Kafedrani qidirish..."
                    />
                    {updateForm.formState.errors.kafedra_id && (
                        <p className="mt-1 text-xs text-destructive">{updateForm.formState.errors.kafedra_id.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Foydalanuvchi</label>
                    <Combobox
                        options={users.map(u => ({ value: u.id.toString(), label: u.username }))}
                        value={selectedUserId ? selectedUserId.toString() : ""}
                        onChange={(val) => updateForm.setValue('user_id', val ? Number(val) : 0)}
                        placeholder="Foydalanuvchini tanlang..."
                        searchPlaceholder="Foydalanuvchini qidirish..."
                    />
                    {updateForm.formState.errors.user_id && (
                        <p className="mt-1 text-xs text-destructive">{updateForm.formState.errors.user_id.message}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" isLoading={isSubmitting}>Yangilash</Button>
                </div>
            </form>
        </Modal>
    );
};

const TeacherGroupModal = ({ isOpen, onClose, teacher }: { isOpen: boolean; onClose: () => void; teacher: Teacher | null }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: groupsData } = useGroups(1, 100, debouncedSearch);
    const assignGroupsMutation = useAssignGroups();
    const groups = groupsData?.groups || [];

    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

    useEffect(() => {
        if (teacher && isOpen) {
            setSelectedGroupIds(teacher.user?.group_teachers?.map((g: any) => g.group_id) || []);
            setSearchQuery('');
            setDebouncedSearch('');
        }
    }, [teacher, isOpen]);

    const handleToggleGroup = (id: number) => {
        setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const handleSave = () => {
        if (!teacher || !teacher.user) return;
        assignGroupsMutation.mutate({ user_id: teacher.user.id, group_ids: selectedGroupIds }, {
            onSuccess: () => onClose(),
            onError: () => alert("Guruhlarni biriktirishda xatolik yuz berdi")
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${teacher?.full_name} ga guruhlarni biriktirish`}>
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Guruhlarni qidirish..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-4 border rounded-md bg-muted/20">
                    {groups.map(group => (
                        <div key={group.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`group-${group.id}`}
                                checked={selectedGroupIds.includes(group.id)}
                                onChange={() => handleToggleGroup(group.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">
                                {group.name}
                            </label>
                        </div>
                    ))}
                    {groups.length === 0 && <span className="text-sm text-muted-foreground">Guruhlar topilmadi.</span>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleSave} isLoading={assignGroupsMutation.isPending}>Saqlash</Button>
                </div>
            </div>
        </Modal>
    );
};

const TeacherSubjectModal = ({ isOpen, onClose, teacher }: { isOpen: boolean; onClose: () => void; teacher: Teacher | null }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: subjectsData } = useSubjects(1, 100, debouncedSearch);
    const assignSubjectsMutation = useAssignSubjects();
    const subjects = subjectsData?.subjects || [];

    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

    useEffect(() => {
        if (teacher && isOpen) {
            setSelectedSubjectIds(teacher.subject_teachers?.map(s => s.subject_id) || []);
            setSearchQuery('');
            setDebouncedSearch('');
        }
    }, [teacher, isOpen]);

    const handleToggleSubject = (id: number) => {
        setSelectedSubjectIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleSave = () => {
        if (!teacher) return;
        assignSubjectsMutation.mutate({ teacher_id: teacher.id, subject_ids: selectedSubjectIds }, {
            onSuccess: () => onClose(),
            onError: () => alert("Fanlarni biriktirishda xatolik yuz berdi")
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${teacher?.full_name} ga fanlarni biriktirish`}>
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Fanlarni qidirish..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-4 border rounded-md bg-muted/20">
                    {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`subject-${subject.id}`}
                                checked={selectedSubjectIds.includes(subject.id)}
                                onChange={() => handleToggleSubject(subject.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">
                                {subject.name}
                            </label>
                        </div>
                    ))}
                    {subjects.length === 0 && <span className="text-sm text-muted-foreground">Fanlar topilmadi.</span>}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleSave} isLoading={assignSubjectsMutation.isPending}>Saqlash</Button>
                </div>
            </div>
        </Modal>
    );
};

export default TeachersPage;
