import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { permissionService, type Permission } from '@/services/permissionService';
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

const permissionSchema = z.object({
    name: z.string().min(1, 'Permission name is required'),
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

const PermissionsPage = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await permissionService.getPermissions(currentPage, pageSize, debouncedSearch);
            setPermissions(data.permissions);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error('Failed to fetch permissions', error);
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

    const handleDeleteClick = (permission: Permission) => {
        setPermissionToDelete(permission);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!permissionToDelete) return;
        try {
            await permissionService.deletePermission(permissionToDelete.id);
            setPermissions((prev) => prev.filter((item) => item.id !== permissionToDelete.id));
            setIsDeleteModalOpen(false);
            setPermissionToDelete(null);
        } catch (error) {
            console.error('Failed to delete permission', error);
        }
    };

    const handleSuccess = (savedPermission?: Permission) => {
        setIsModalOpen(false);
        if (savedPermission) {
            if (selectedPermission) {
                setPermissions((prev) => prev.map((p) => (p.id === savedPermission.id ? savedPermission : p)));
            } else {
                setPermissions((prev) => [...prev, savedPermission]);
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
                    <h1 className="text-xl font-semibold tracking-tight">Ruxsatlar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Tizim ruxsatlarini boshqarish</p>
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
                    <Button onClick={() => { setSelectedPermission(null); setIsModalOpen(true); }}>
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
                                {permissions.map((perm) => (
                                    <TableRow key={perm.id}>
                                        <TableCell>{perm.id}</TableCell>
                                        <TableCell className="font-medium">{perm.name}</TableCell>
                                        <TableCell>{new Date(perm.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedPermission(perm); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(perm)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {permissions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No permissions found.</TableCell>
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

            <PermissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} permission={selectedPermission}
                onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Permission"
                description={`Are you sure you want to delete the permission "${permissionToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const PermissionModal = ({ isOpen, onClose, permission, onSuccess }: {
    isOpen: boolean; onClose: () => void; permission: Permission | null; onSuccess: (permission?: Permission) => void;
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PermissionFormValues>({
        resolver: zodResolver(permissionSchema),
        defaultValues: { name: '' },
    });

    useEffect(() => {
        reset({ name: permission?.name || '' });
    }, [permission, reset]);

    const onSubmit = async (data: PermissionFormValues) => {
        try {
            let result;
            if (permission) {
                result = await permissionService.updatePermission(permission.id, data);
            } else {
                result = await permissionService.createPermission(data);
            }
            onSuccess(result);
        } catch (error) {
            console.error('Failed to save permission', error);
            alert('Failed to save permission');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={permission ? 'Edit Permission' : 'Create Permission'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Permission Name" {...register('name')} error={errors.name?.message} placeholder="e.g. read:user, create:quiz" />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isSubmitting}>{permission ? 'Update' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default PermissionsPage;
