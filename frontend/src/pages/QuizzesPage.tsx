import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Pagination } from '@/components/ui/Pagination';
import type { Quiz, QuizCreateRequest } from '@/services/quizService';
import type { Subject } from '@/services/subjectService';
import type { Group } from '@/services/groupService';
import { Button } from '@/components/ui/Button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, BookOpen, Search, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuizzes, useCreateQuiz, useUpdateQuiz, useDeleteQuiz } from '@/hooks/useQuizzes';
import { useSubjects } from '@/hooks/useSubjects';
import { useGroups } from '@/hooks/useGroups';
import { useTeachers, useTeacherAssignedGroups } from '@/hooks/useTeachers';
import { useTeacherAssignedSubjects } from '@/hooks/useSubjects';
import { Combobox } from '@/components/ui/Combobox';
import type { Teacher } from '@/services/teacherService';

const quizSchema = z.object({
    title: z.string().min(3, 'Sarlavha kiritilishi shart'),
    question_number: z.string().min(1, 'Savollar soni kiritilishi shart').refine((val: string) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Musbat son bo\'lishi kerak'),
    duration: z.string().min(1, 'Davomiylik kiritilishi shart').refine((val: string) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Musbat son bo\'lishi kerak'),
    pin: z.string().min(4, 'PIN kiritilishi shart'),
    user_id: z.string().optional(),
    group_id: z.string().optional(),
    subject_id: z.string().optional(),
    is_active: z.boolean(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

const QuizzesPage = () => {
    const { user } = useAuth();
    const isTeacher = user?.roles?.some(r => r.name.toLowerCase() === 'teacher');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filter states
    const [filterSubjectId, setFilterSubjectId] = useState<number | undefined>(undefined);
    const [filterGroupId, setFilterGroupId] = useState<number | undefined>(undefined);
    const [filterUserId, setFilterUserId] = useState<number | undefined>(undefined);
    const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: quizzesData, isLoading: isQuizzesLoading } = useQuizzes(
        currentPage,
        pageSize,
        debouncedSearch,
        filterIsActive,
        filterUserId,
        filterGroupId,
        filterSubjectId
    );

    // Fetch data for filters (all items)
    const { data: allSubjectsData } = useSubjects(1, 100);
    const { data: allGroupsData } = useGroups(1, 100, '');
    const { data: allTeachersData } = useTeachers(1, 200);

    const updateQuizMutation = useUpdateQuiz();
    const deleteQuizMutation = useDeleteQuiz();

    const quizzes = quizzesData?.quizzes || [];
    const totalPages = quizzesData ? Math.ceil(quizzesData.total / pageSize) : 1;
    const allSubjects = allSubjectsData?.subjects || [];
    const allGroups = allGroupsData?.groups || [];
    const allTeachers = allTeachersData?.teachers || [];

    const handleCreateQuiz = () => {
        setSelectedQuiz(null);
        setIsModalOpen(true);
    };

    const handleEditQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (quiz: Quiz) => {
        setQuizToDelete(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!quizToDelete) return;
        deleteQuizMutation.mutate(quizToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setQuizToDelete(null);
            },
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
    };

    const handleToggleStatus = (quiz: Quiz) => {
        setIsUpdatingStatus(quiz.id);
        const payload: QuizCreateRequest = {
            title: quiz.title,
            question_number: quiz.question_number,
            duration: quiz.duration,
            pin: quiz.pin,
            user_id: quiz.user_id ?? null,
            group_id: quiz.group_id ?? null,
            subject_id: quiz.subject_id ?? null,
            is_active: !quiz.is_active,
        };

        updateQuizMutation.mutate({ id: quiz.id, data: payload }, {
            onSettled: () => {
                setIsUpdatingStatus(null);
            },
            onError: (error: unknown) => {
                console.error('Failed to update quiz status', error);
                alert('Test holatini yangilashda xatolik yuz berdi');
            }
        });
    };

    const getSubjectName = (id?: number) => allSubjects.find((s: Subject) => s.id === id)?.name || '-';
    const getGroupName = (id?: number) => allGroups.find((g: Group) => g.id === id)?.name || '-';

    const clearFilters = () => {
        setFilterSubjectId(undefined);
        setFilterGroupId(undefined);
        setFilterUserId(undefined);
        setFilterIsActive(undefined);
        setSearchTerm('');
    };

    const hasActiveFilters = filterSubjectId !== undefined || filterGroupId !== undefined || filterUserId !== undefined || filterIsActive !== undefined || searchTerm !== '';

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Testlar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Testlarni va topshiriqlarni boshqarish</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Qidirish..."
                            className="pl-8 w-[220px]"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreateQuiz}>
                        <Plus className="mr-2 h-4 w-4" />
                        Test yaratish
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                            <label className="text-sm font-medium">Fan bo'yicha filtri</label>
                            <Combobox
                                options={allSubjects.map(s => ({ value: s.id.toString(), label: s.name }))}
                                value={filterSubjectId?.toString()}
                                onChange={(val) => setFilterSubjectId(val ? parseInt(val) : undefined)}
                                placeholder="Barcha fanlar"
                                searchPlaceholder="Fanni qidirish..."
                            />
                        </div>
                        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                            <label className="text-sm font-medium">Guruh bo'yicha filtri</label>
                            <Combobox
                                options={allGroups.map(g => ({ value: g.id.toString(), label: g.name }))}
                                value={filterGroupId?.toString()}
                                onChange={(val) => setFilterGroupId(val ? parseInt(val) : undefined)}
                                placeholder="Barcha guruhlar"
                                searchPlaceholder="Guruhni qidirish..."
                            />
                        </div>
                        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
                            <label className="text-sm font-medium">O'qituvchi bo'yicha filtri</label>
                            <Combobox
                                options={allTeachers.map(t => ({ value: t.user_id.toString(), label: t.full_name }))}
                                value={filterUserId?.toString()}
                                onChange={(val) => setFilterUserId(val ? parseInt(val) : undefined)}
                                placeholder="Barcha o'qituvchilar"
                                searchPlaceholder="O'qituvchini qidirish..."
                            />
                        </div>
                        <div className="flex flex-col gap-2 w-[150px]">
                            <label className="text-sm font-medium">Holat</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={filterIsActive === undefined ? 'all' : filterIsActive.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterIsActive(val === 'all' ? undefined : val === 'true');
                                }}
                            >
                                <option value="all">Barchasi</option>
                                <option value="true">Faol</option>
                                <option value="false">Faol emas</option>
                            </select>
                        </div>
                        {hasActiveFilters && (
                            <Button variant="ghost" onClick={clearFilters} className="mb-0.5">
                                <X className="mr-2 h-4 w-4" />
                                Tozalash
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>


            <Card>
                <CardContent>
                    {isQuizzesLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                            <p>Testlar topilmadi. {hasActiveFilters ? 'Filtrlarni o\'zgartirib ko\'ring.' : 'Boshlash uchun yangi test yarating.'}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sarlavha</TableHead>
                                    <TableHead>S/S</TableHead>
                                    <TableHead>Davomiyligi</TableHead>
                                    <TableHead>PIN</TableHead>
                                    <TableHead>Faol</TableHead>
                                    <TableHead>Fan</TableHead>
                                    <TableHead>Guruh</TableHead>
                                    {!isTeacher && <TableHead className="text-right">Amallar</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quizzes.map((quiz) => (
                                    <TableRow key={quiz.id}>
                                        <TableCell className="font-medium capitalize">{quiz.title}</TableCell>
                                        <TableCell>{quiz.question_number}</TableCell>
                                        <TableCell>{quiz.duration} daq</TableCell>
                                        <TableCell><span className="font-mono bg-muted px-2 py-1 rounded">{quiz.pin}</span></TableCell>
                                        <TableCell>
                                            {isTeacher ? (
                                                <span className={`text-xs font-medium ${quiz.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                    {quiz.is_active ? 'Faol' : 'Faol emas'}
                                                </span>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={quiz.is_active}
                                                        onCheckedChange={() => handleToggleStatus(quiz)}
                                                        disabled={isUpdatingStatus === quiz.id || updateQuizMutation.isPending}
                                                    />
                                                    <span className={`text-xs ${quiz.is_active ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                                        {quiz.is_active ? 'Faol' : 'Faol emas'}
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">{getSubjectName(quiz.subject_id)}</TableCell>
                                        <TableCell className="capitalize">{getGroupName(quiz.group_id)}</TableCell>
                                        {!isTeacher && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditQuiz(quiz)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteClick(quiz)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
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
                isLoading={isQuizzesLoading}
            />

            <QuizModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                quiz={selectedQuiz}
                teachers={allTeachers}
                onSuccess={handleSuccess}
            />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Testni o'chirish"
                description={`"${quizToDelete?.title}" testini o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

const QuizModal = ({
    isOpen,
    onClose,
    quiz,
    teachers,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz | null;
    teachers: Teacher[];
    onSuccess: () => void;
}) => {
    const { user } = useAuth();
    const isTeacher = user?.roles?.some(r => r.name.toLowerCase() === 'teacher');

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm<QuizFormValues>({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: '',
            is_active: false,
        }
    });

    const createMutation = useCreateQuiz();
    const updateMutation = useUpdateQuiz();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const isActive = watch('is_active');
    const selectedUserId = watch('user_id');

    // For the teacher role: always use their own user_id
    // For admin: use the selected teacher's user_id
    const effectiveUserId = isTeacher ? user?.id?.toString() : selectedUserId;

    // Fetch ALL subjects and groups for admin/fallback
    const { data: allSubjectsData } = useSubjects(1, 200);
    const { data: allGroupsData } = useGroups(1, 200, '');

    // Fetch the selected teacher's assigned subjects and groups
    const { data: assignedSubjectsData } = useTeacherAssignedSubjects(
        effectiveUserId ? parseInt(effectiveUserId) : undefined
    );
    const { data: assignedGroupsData } = useTeacherAssignedGroups(
        effectiveUserId ? parseInt(effectiveUserId) : undefined
    );

    const allSubjects = allSubjectsData?.subjects || [];
    const allGroups = allGroupsData?.groups || [];

    // When a teacher (or selected user) is known, filter to their assigned subjects/groups
    // Otherwise show everything
    const subjectOptions = effectiveUserId && assignedSubjectsData
        ? assignedSubjectsData.subject_teachers.map(st => ({ value: st.subject_id.toString(), label: st.subject.name }))
        : allSubjects.map(s => ({ value: s.id.toString(), label: s.name }));

    const groupOptions = effectiveUserId && assignedGroupsData
        ? assignedGroupsData.group_teachers.map(gt => ({ value: gt.group_id.toString(), label: gt.group.name }))
        : allGroups.map(g => ({ value: g.id.toString(), label: g.name }));

    useEffect(() => {
        if (!isOpen) return;
        if (quiz) {
            reset({
                title: quiz.title,
                question_number: quiz.question_number.toString(),
                duration: quiz.duration.toString(),
                pin: quiz.pin,
                user_id: quiz.user_id ? quiz.user_id.toString() : '',
                group_id: quiz.group_id ? quiz.group_id.toString() : '',
                subject_id: quiz.subject_id ? quiz.subject_id.toString() : '',
                is_active: quiz.is_active,
            });
        } else {
            reset({
                title: '',
                question_number: '10',
                duration: '30',
                pin: Math.random().toString().slice(2, 6),
                // Auto-set teacher's own user_id if teacher role
                user_id: isTeacher && user?.id ? user.id.toString() : '',
                group_id: '',
                subject_id: '',
                is_active: false,
            });
        }
    }, [quiz, reset, isOpen, isTeacher, user]);

    // When the selected teacher changes (admin only), reset subject/group
    useEffect(() => {
        if (isOpen && !quiz && !isTeacher) {
            setValue('subject_id', '');
            setValue('group_id', '');
        }
    }, [selectedUserId, isOpen, quiz, isTeacher]);

    const onSubmit = (data: QuizFormValues) => {
        // For teacher role, always use their own id
        const resolvedUserId = isTeacher && user?.id
            ? user.id
            : (data.user_id && data.user_id !== '' ? parseInt(data.user_id, 10) : null);

        const payload: QuizCreateRequest = {
            title: data.title,
            question_number: parseInt(data.question_number, 10),
            duration: parseInt(data.duration, 10),
            pin: data.pin,
            user_id: resolvedUserId,
            group_id: data.group_id && data.group_id !== '' ? parseInt(data.group_id, 10) : null,
            subject_id: data.subject_id && data.subject_id !== '' ? parseInt(data.subject_id, 10) : null,
            is_active: data.is_active,
        };

        if (quiz) {
            updateMutation.mutate({ id: quiz.id, data: payload }, {
                onSuccess: () => onSuccess(),
                onError: (error: unknown) => {
                    console.error('Failed to update quiz', error);
                    alert('Testni yangilashda xatolik yuz berdi');
                }
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => onSuccess(),
                onError: (error: unknown) => {
                    console.error('Failed to create quiz', error);
                    alert('Testni yaratishda xatolik yuz berdi');
                }
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={quiz ? 'Testni tahrirlash' : 'Test yaratish'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Sarlavha"
                    {...register('title')}
                    error={errors.title?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Savollar soni"
                        type="number"
                        {...register('question_number')}
                        error={errors.question_number?.message}
                    />
                    <Input
                        label="Davomiyligi (daq)"
                        type="number"
                        {...register('duration')}
                        error={errors.duration?.message}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="PIN kod"
                        {...register('pin')}
                        error={errors.pin?.message}
                    />
                    <div className="flex items-center space-x-2 pt-8">
                        <Switch
                            id="modal-is-active"
                            checked={isActive}
                            onCheckedChange={(checked) => setValue('is_active', checked)}
                        />
                        <label htmlFor="modal-is-active" className="text-sm font-medium leading-none cursor-pointer">
                            Faol
                        </label>
                    </div>
                </div>

                {/* Teacher selector: show for admins only. Teachers see their own name as read-only. */}
                {isTeacher ? (
                    <div className="space-y-1">
                        <label className="text-sm font-medium">O'qituvchi</label>
                        <p className="text-sm bg-muted rounded px-3 py-2">
                            {teachers.find(t => t.user_id === user?.id)?.full_name || user?.username || '-'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">O'qituvchi</label>
                        <Controller
                            name="user_id"
                            control={control}
                            render={({ field }) => (
                                <Combobox
                                    options={teachers.map(t => ({ value: t.user_id.toString(), label: t.full_name }))}
                                    value={field.value}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        setValue('subject_id', '');
                                        setValue('group_id', '');
                                    }}
                                    placeholder="O'qituvchini tanlang"
                                    searchPlaceholder="Qidirish..."
                                />
                            )}
                        />
                        {errors.user_id && <p className="text-sm text-red-500">{errors.user_id.message}</p>}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Fan</label>
                    <Controller
                        name="subject_id"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                options={subjectOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Fanni tanlang"
                                searchPlaceholder="Qidirish..."
                            />
                        )}
                    />
                    {errors.subject_id && <p className="text-sm text-red-500">{errors.subject_id.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Guruh</label>
                    <Controller
                        name="group_id"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                options={groupOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Guruhni tanlang"
                                searchPlaceholder="Qidirish..."
                            />
                        )}
                    />
                    {errors.group_id && <p className="text-sm text-red-500">{errors.group_id.message}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Bekor qilish
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {quiz ? 'Yangilash' : 'Yaratish'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default QuizzesPage;
