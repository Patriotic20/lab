import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { roleService, type Role } from '@/services/roleService';
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
import { usePermissions, useAssignPermissions } from '@/hooks/useReferenceData';
import { useNavigate } from 'react-router-dom';


const roleSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
    permission_ids: z.array(z.number()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const RolesPage = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await roleService.getRoles(currentPage, pageSize, debouncedSearch);
            setRoles(data.roles);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error('Failed to fetch roles', error);
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

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            await roleService.deleteRole(roleToDelete.id);
            setRoles((prev) => prev.filter((item) => item.id !== roleToDelete.id));
            setIsDeleteModalOpen(false);
            setRoleToDelete(null);
        } catch (error) {
            console.error('Failed to delete role', error);
        }
    };

    const handleSuccess = (savedRole?: Role) => {
        setIsModalOpen(false);
        if (savedRole) {
            if (selectedRole) {
                setRoles((prev) => prev.map((r) => (r.id === savedRole.id ? savedRole : r)));
            } else {
                setRoles((prev) => [...prev, savedRole]);
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
                    <h1 className="text-xl font-semibold tracking-tight">Rollar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Tizim rollarini va ruxsatlarni boshqarish</p>
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
                    <Button onClick={() => { setSelectedRole(null); setIsModalOpen(true); }}>
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
                                    <TableHead>Ruxsatlar</TableHead>
                                    <TableHead>Yaratilgan sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>{role.id}</TableCell>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[300px] items-center">
                                                {role.permissions && role.permissions.length > 0 ? (
                                                    <>
                                                        <span className="inline-flex items-center rounded-full border border-border/50 px-2.5 py-0.5 text-xs font-semibold text-foreground bg-background">
                                                            {role.permissions[0].name}
                                                        </span>
                                                        {role.permissions.length > 1 && (
                                                            <button 
                                                                onClick={() => navigate(`/roles/${role.id}/permissions`)}
                                                                className="inline-flex items-center rounded-full bg-secondary/50 hover:bg-secondary px-2.5 py-0.5 text-xs font-semibold transition-colors text-secondary-foreground cursor-pointer"
                                                            >
                                                                +{role.permissions.length - 1} ko'proq
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{role.created_at ? new Date(role.created_at).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(role); setIsModalOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(role)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {roles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No roles found.</TableCell>
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

            <RoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} role={selectedRole}
                onSuccess={handleSuccess} />
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Role"
                description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

const RoleModal = ({ isOpen, onClose, role, onSuccess }: {
    isOpen: boolean; onClose: () => void; role: Role | null; onSuccess: (role?: Role) => void;
}) => {
    const { data: permissionsData } = usePermissions();
    const permissions = permissionsData?.permissions || [];
    const assignPermissionsMutation = useAssignPermissions();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', permission_ids: [] },
    });

    useEffect(() => {
        reset({
            name: role?.name || '',
            permission_ids: role?.permissions?.map(p => p.id) || []
        });
    }, [role, reset]);

    const onSubmit = async (data: RoleFormValues) => {
        try {
            let result;
            if (role) {
                result = await roleService.updateRole(role.id, { name: data.name });
            } else {
                result = await roleService.createRole({ name: data.name });
            }

            // Assign permissions
            const roleId = role ? role.id : result.id;
            await assignPermissionsMutation.mutateAsync({ role_id: roleId, permission_ids: data.permission_ids || [] });

            // Assuming successful
            onSuccess();
        } catch (error) {
            console.error('Failed to save role', error);
            alert('Failed to save role or assign permissions');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Edit Role' : 'Create Role'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Role Name" {...register('name')} error={errors.name?.message} placeholder="e.g. admin, teacher, student" />

                <div className="space-y-2">
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto p-2 border rounded-md">
                        {permissions.map((perm) => (
                            <div key={perm.id} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={`perm-${perm.id}`}
                                    value={perm.id}
                                    {...register('permission_ids', { valueAsNumber: true })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis">
                                    {perm.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isSubmitting || assignPermissionsMutation.isPending}>{role ? 'Update' : 'Create'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default RolesPage;
