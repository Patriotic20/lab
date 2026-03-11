import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/Table';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { facultyService, type Faculty } from '@/services/facultyService';

const facultySchema = z.object({
    name: z.string().min(1, 'Fakultet nomi kiritilishi shart'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

const FacultyPage = () => {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await facultyService.getFaculties(currentPage, pageSize, debouncedSearch);
            setFaculties(data.faculties);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error('Failed to fetch faculties', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => { fetchData(); }, [currentPage, debouncedSearch]);

    const handleDeleteClick = (faculty: Faculty) => {
        setFacultyToDelete(faculty);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!facultyToDelete) return;
        try {
            await facultyService.deleteFaculty(facultyToDelete.id);
            setFaculties((prev) => prev.filter((item) => item.id !== facultyToDelete.id));
            setIsDeleteModalOpen(false);
            setFacultyToDelete(null);
        } catch (error) {
            console.error('Fakultetni o\'chirishda xatolik', error);
        }
    };

    const handleSuccess = (savedFaculty?: Faculty) => {
        setIsModalOpen(false);
        if (savedFaculty) {
            if (selectedFaculty) {
                setFaculties((prev) => prev.map((f) => (f.id === savedFaculty.id ? savedFaculty : f)));
            } else {
                setFaculties((prev) => [...prev, savedFaculty]);
            }
        } else {
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Fakultetlar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Universitet fakultetlarini boshqarish</p>
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
                    <Button onClick={() => { setSelectedFaculty(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
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
                                {faculties.map((faculty) => (
                                    <TableRow key={faculty.id}>
                                        <TableCell>{faculty.id}</TableCell>
                                        <TableCell className="font-medium capitalize">{faculty.name}</TableCell>
                                        <TableCell>{new Date(faculty.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedFaculty(faculty); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(faculty)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {faculties.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Fakultetlar topilmadi.</TableCell>
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
                isLoading={isLoading}
            />

            <FacultyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} faculty={selectedFaculty}
                onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Fakultetni o'chirish"
                description={`Siz haqiqatan ham "${facultyToDelete?.name}" fakultetini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

const FacultyModal = ({ isOpen, onClose, faculty, onSuccess }: {
    isOpen: boolean; onClose: () => void; faculty: Faculty | null; onSuccess: (faculty?: Faculty) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FacultyFormValues>({
        resolver: zodResolver(facultySchema),
        defaultValues: { name: '' },
    });

    useEffect(() => {
        reset({ name: faculty?.name || '' });
    }, [faculty, reset]);

    const onSubmit = async (data: FacultyFormValues) => {
        try {
            let result;
            if (faculty) {
                result = await facultyService.updateFaculty(faculty.id, data);
            } else {
                result = await facultyService.createFaculty(data);
            }
            onSuccess(result);
        } catch (error) {
            console.error('Fakultetni saqlashda xatolik', error);
            alert('Fakultetni saqlashda xatolik');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={faculty ? 'Fakultetni tahrirlash' : 'Fakultet yaratish'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Fakultet nomi</label>
                    <Input {...register('name')} error={errors.name?.message} placeholder="Fakultet nomini kiriting" />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" isLoading={isSubmitting}>{faculty ? 'Yangilash' : 'Yaratish'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default FacultyPage;
