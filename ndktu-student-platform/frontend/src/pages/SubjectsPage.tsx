import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import type { Subject } from '@/services/subjectService';
import { Button } from '@/components/ui/Button';
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
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';

const subjectSchema = z.object({
    name: z.string().min(1, 'Subject name is required'),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

const SubjectsPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: subjectsData, isLoading: isSubjectsLoading } = useSubjects(currentPage, pageSize, debouncedSearch);
    const deleteSubjectMutation = useDeleteSubject();

    const subjects = subjectsData?.subjects || [];
    const totalPages = subjectsData ? Math.ceil(subjectsData.total / pageSize) : 1;

    const handleDeleteClick = (subject: Subject) => {
        setSubjectToDelete(subject);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!subjectToDelete) return;

        deleteSubjectMutation.mutate(subjectToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSubjectToDelete(null);
            },
        });
    };

    const handleSuccess = (_savedSubject?: Subject) => {
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Fanlar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">O'quv fanlarini boshqarish</p>
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
                    <Button onClick={() => { setSelectedSubject(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isSubjectsLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell>{subject.id}</TableCell>
                                        <TableCell className="font-medium capitalize">{subject.name}</TableCell>
                                        <TableCell>{new Date(subject.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setSelectedSubject(subject); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(subject)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {subjects.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Fanlar topilmadi.</TableCell>
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
                isLoading={isSubjectsLoading}
            />

            <SubjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                subject={selectedSubject}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Fanni o'chirish"
                description={`Siz haqiqatan ham "${subjectToDelete?.name}" fanini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

const SubjectModal = ({
    isOpen,
    onClose,
    subject,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    subject: Subject | null;
    onSuccess: (subject?: Subject) => void;
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SubjectFormValues>({
        resolver: zodResolver(subjectSchema),
        defaultValues: { name: '' },
    });

    const createMutation = useCreateSubject();
    const updateMutation = useUpdateSubject();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (subject) {
            reset({
                name: subject.name,
            });
        } else {
            reset({
                name: '',
            });
        }
    }, [subject, reset]);

    const onSubmit = (data: SubjectFormValues) => {
        if (subject) {
            updateMutation.mutate({ id: subject.id, data }, {
                onSuccess: (data) => onSuccess(data),
                onError: () => alert('Fanni yangilashda xatolik'),
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: (data) => onSuccess(data),
                onError: () => alert('Fan yaratishda xatolik'),
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subject ? 'Fanni tahrirlash' : 'Fan yaratish'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Fan nomi"
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder="Fan nomini kiriting"
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Bekor qilish
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {subject ? 'Yangilash' : 'Yaratish'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SubjectsPage;
