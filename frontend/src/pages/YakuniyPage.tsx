import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Yakuniy, YakuniyCreateRequest } from '@/services/yakuniyService';
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
import { Plus, Pencil, Trash2, Loader2, Search, ClipboardList, GraduationCap, BookOpen, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useYakuniyList, useCreateYakuniy, useUpdateYakuniy, useDeleteYakuniy } from '@/hooks/useYakuniy';
import { useSubjects } from '@/hooks/useSubjects';
import { useStudents } from '@/hooks/useStudents';
import { Input } from '@/components/ui/Input';
import { Combobox } from '@/components/ui/Combobox';

const gradeOptions = [
    { value: 2, label: '2', color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900', activeColor: 'border-red-500 bg-red-500 text-white ring-2 ring-red-300 dark:ring-red-700' },
    { value: 3, label: '3', color: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 dark:hover:bg-yellow-900', activeColor: 'border-yellow-500 bg-yellow-500 text-white ring-2 ring-yellow-300 dark:ring-yellow-700' },
    { value: 4, label: '4', color: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900', activeColor: 'border-blue-500 bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-700' },
    { value: 5, label: '5', color: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900', activeColor: 'border-green-500 bg-green-500 text-white ring-2 ring-green-300 dark:ring-green-700' },
];

const YakuniyPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterSubject, setFilterSubject] = useState<string>('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Yakuniy | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Yakuniy | null>(null);

    // Form state
    const [formUserId, setFormUserId] = useState<string>('');
    const [formSubjectId, setFormSubjectId] = useState<string>('');
    const [formGrade, setFormGrade] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const parsedFilterSubject = filterSubject ? parseInt(filterSubject) : undefined;
    const [studentLimit, setStudentLimit] = useState(10);

    const { data: yakuniyData, isLoading } = useYakuniyList(
        currentPage,
        pageSize,
        parsedFilterSubject,
        undefined,
        debouncedSearch || undefined,
    );
    const { data: subjectsData } = useSubjects(1, 200);
    const { data: studentsData } = useStudents(1, studentLimit);

    // Update student limit based on actual total
    useEffect(() => {
        if (studentsData?.total && studentLimit < studentsData.total) {
            setStudentLimit(studentsData.total);
        }
    }, [studentsData?.total, studentLimit]);

    const subjects = subjectsData?.subjects || [];
    const students = studentsData?.students || [];
    const yakuniyResults = yakuniyData?.yakuniy_results || [];
    const totalPages = yakuniyData ? Math.ceil(yakuniyData.total / pageSize) : 1;

    const createMutation = useCreateYakuniy();
    const updateMutation = useUpdateYakuniy();
    const deleteMutation = useDeleteYakuniy();

    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormUserId('');
        setFormSubjectId('');
        setFormGrade('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: Yakuniy, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(item);
        setFormUserId(String(item.user_id));
        setFormSubjectId(String(item.subject_id));
        setFormGrade(String(item.grade));
        setIsModalOpen(true);
    };

    const handleDeleteClick = (item: Yakuniy, e: React.MouseEvent) => {
        e.stopPropagation();
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        deleteMutation.mutate(itemToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            },
        });
    };

    const handleSubmit = () => {
        if (!formUserId || !formSubjectId || !formGrade) return;

        const gradeNum = parseInt(formGrade);
        if (gradeNum < 2 || gradeNum > 5) return;

        const data: YakuniyCreateRequest = {
            user_id: parseInt(formUserId),
            subject_id: parseInt(formSubjectId),
            grade: gradeNum,
        };

        if (editingItem) {
            updateMutation.mutate(
                { id: editingItem.id, data },
                {
                    onSuccess: () => {
                        setIsModalOpen(false);
                        setEditingItem(null);
                    },
                    onError: (error: any) => {
                        const msg = error?.response?.data?.detail || "Yangilashda xatolik yuz berdi";
                        alert(msg);
                    },
                },
            );
        } else {
            createMutation.mutate(data, {
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: (error: any) => {
                    const msg = error?.response?.data?.detail || "Yaratishda xatolik yuz berdi";
                    alert(msg);
                },
            });
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Yakuniy natijalar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Yakuniy baholash natijalarini boshqarish</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-[180px]">
                        <Combobox
                            options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
                            value={filterSubject}
                            onChange={(val) => { setFilterSubject(val); setCurrentPage(1); }}
                            placeholder="Barcha fanlar"
                            searchPlaceholder="Fanni qidirish..."
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Username qidirish..."
                            className="pl-8 w-[220px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : yakuniyResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
                            <p>Yakuniy natijalar topilmadi.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Foydalanuvchi</TableHead>
                                    <TableHead>Talaba F.I.SH</TableHead>
                                    <TableHead>Fan</TableHead>
                                    <TableHead>Baho</TableHead>
                                    <TableHead>Sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {yakuniyResults.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.user?.username || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {item.student_name || '-'}
                                        </TableCell>
                                        <TableCell>{item.subject?.name || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                item.grade >= 4
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : item.grade >= 3
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                                {item.grade}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handleOpenEdit(item, e)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={(e) => handleDeleteClick(item, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {yakuniyResults.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={isLoading}
                />
            )}

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Yakuniy natijani tahrirlash" : "Yakuniy natija qo'shish"}
            >
                <div className="space-y-5">
                    {/* Student field */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            Talaba
                        </label>
                        <Combobox
                            options={students.map(s => ({ value: String(s.user_id), label: s.full_name || `ID: ${s.user_id}` }))}
                            value={formUserId}
                            onChange={setFormUserId}
                            placeholder="Talaba tanlang"
                            searchPlaceholder="Talabani qidirish..."
                        />
                    </div>

                    {/* Subject field */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            Fan
                        </label>
                        <Combobox
                            options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
                            value={formSubjectId}
                            onChange={setFormSubjectId}
                            placeholder="Fan tanlang"
                            searchPlaceholder="Fanni qidirish..."
                        />
                    </div>

                    {/* Grade selector */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            Baho
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {gradeOptions.map((opt) => {
                                const isActive = formGrade === String(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormGrade(String(opt.value))}
                                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 py-4 text-center transition-all duration-200 cursor-pointer ${
                                            isActive ? opt.activeColor : opt.color
                                        }`}
                                    >
                                        <span className="text-2xl font-bold leading-none">{opt.label}</span>
                                        <span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-white/80' : 'opacity-60'}`}>
                                            {opt.value === 2 ? "Yomon" : opt.value === 3 ? "Qoniqarli" : opt.value === 4 ? "Yaxshi" : "A'lo"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-5 border-t">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            disabled={!formUserId || !formSubjectId || !formGrade}
                        >
                            {editingItem ? 'Saqlash' : "Qo'shish"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                onConfirm={handleConfirmDelete}
                title="Yakuniy natijani o'chirish"
                description={`Haqiqatan ham ushbu natijani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

export default YakuniyPage;
