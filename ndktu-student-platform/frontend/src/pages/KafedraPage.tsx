import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { type Kafedra } from '@/services/kafedraService';
import { type Faculty } from '@/services/facultyService';
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
import { useKafedras, useCreateKafedra, useUpdateKafedra, useDeleteKafedra, useFaculties } from '@/hooks/useReferenceData';

const kafedraSchema = z.object({
    name: z.string().min(1, 'Kafedra nomi kiritilishi shart'),
    faculty_id: z.number().min(1, 'Fakultet tanlanishi shart'),
});

type KafedraFormValues = z.infer<typeof kafedraSchema>;

const KafedraPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKafedra, setSelectedKafedra] = useState<Kafedra | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [kafedraToDelete, setKafedraToDelete] = useState<Kafedra | null>(null);
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

    const { data: kafedrasData, isLoading: isKafedrasLoading } = useKafedras(currentPage, pageSize, debouncedSearch);
    const { data: facultiesData } = useFaculties();
    const deleteKafedraMutation = useDeleteKafedra();

    const kafedras = kafedrasData?.kafedras || [];
    const totalPages = kafedrasData ? Math.ceil(kafedrasData.total / pageSize) : 1;
    const faculties = facultiesData?.faculties || [];

    const handleDeleteClick = (kafedra: Kafedra) => {
        setKafedraToDelete(kafedra);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!kafedraToDelete) return;

        deleteKafedraMutation.mutate(kafedraToDelete.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setKafedraToDelete(null);
            },
        });
    };

    const getFacultyName = (facultyId: number) => {
        const faculty = faculties.find(f => f.id === facultyId);
        return faculty ? faculty.name : `ID: ${facultyId}`;
    };

    const handleSuccess = (_savedKafedra?: Kafedra) => {
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Kafedralar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Universitet kafedralarini boshqarish</p>
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
                    <Button onClick={() => { setSelectedKafedra(null); setIsModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Qo'shish
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isKafedrasLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Fakultet</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kafedras.map((kafedra) => (
                                    <TableRow key={kafedra.id}>
                                        <TableCell>{kafedra.id}</TableCell>
                                        <TableCell className="font-medium capitalize">{kafedra.name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                                                {getFacultyName(kafedra.faculty_id)}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(kafedra.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedKafedra(kafedra); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(kafedra)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {kafedras.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Kafedralar topilmadi.</TableCell>
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
                isLoading={isKafedrasLoading}
            />

            <KafedraModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} kafedra={selectedKafedra}
                faculties={faculties} onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Kafedrani o'chirish"
                description={`Siz haqiqatan ham "${kafedraToDelete?.name}" kafedrasini o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
};

const KafedraModal = ({ isOpen, onClose, kafedra, faculties, onSuccess }: {
    isOpen: boolean; onClose: () => void; kafedra: Kafedra | null; faculties: Faculty[]; onSuccess: (kafedra?: Kafedra) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<KafedraFormValues>({
        resolver: zodResolver(kafedraSchema),
        defaultValues: { name: '', faculty_id: 0 },
    });

    const createMutation = useCreateKafedra();
    const updateMutation = useUpdateKafedra();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const selectedFacultyId = watch('faculty_id');

    useEffect(() => {
        if (kafedra) {
            reset({ name: kafedra.name, faculty_id: kafedra.faculty_id });
        } else {
            reset({ name: '', faculty_id: 0 });
        }
    }, [kafedra, reset]);

    const onSubmit = (data: KafedraFormValues) => {
        if (kafedra) {
            updateMutation.mutate({ id: kafedra.id, data }, {
                onSuccess: (data) => onSuccess(data),
                onError: () => alert('Kafedrani yangilashda xatolik'),
            });
        } else {
            createMutation.mutate(data, {
                onSuccess: (data) => onSuccess(data),
                onError: () => alert('Kafedra yaratishda xatolik'),
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={kafedra ? 'Kafedrani tahrirlash' : 'Kafedra yaratish'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Kafedra nomi" {...register('name')} error={errors.name?.message} placeholder="Kafedra nomini kiriting" />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fakultet</label>
                    <select
                        value={selectedFacultyId}
                        onChange={(e) => setValue('faculty_id', Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value={0}>Fakultetni tanlang...</option>
                        {faculties.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                        ))}
                    </select>
                    {errors.faculty_id && (
                        <p className="mt-1 text-xs text-destructive">{errors.faculty_id.message}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button type="submit" isLoading={isSubmitting}>{kafedra ? 'Yangilash' : 'Yaratish'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default KafedraPage;
