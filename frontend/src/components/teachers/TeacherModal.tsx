import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { useKafedras } from '@/hooks/useReferenceData';
import { useUsers } from '@/hooks/useUsers';
import { useCreateTeacherWithUser, useUpdateTeacher } from '@/hooks/useTeachers';
import { useAuth } from '@/context/AuthContext';
import type { Teacher, TeacherFullCreateRequest } from '@/services/teacherService';
import {
    teacherCreateSchema,
    teacherUpdateSchema,
    type TeacherCreateFormValues,
    type TeacherUpdateFormValues,
} from '@/schemas/teacher';

interface TeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher | null;
    onSuccess: () => void;
}

export const TeacherModal = ({ isOpen, onClose, teacher, onSuccess }: TeacherModalProps) => {
    const { hasPermission } = useAuth();
    const { data: kafedrasData } = useKafedras(1, 100, undefined, undefined, hasPermission('read:kafedra'));
    const { data: usersData } = useUsers(1, 100);
    const kafedras = kafedrasData?.kafedras || [];
    const users = usersData?.users || [];

    const createForm = useForm<TeacherCreateFormValues>({
        resolver: zodResolver(teacherCreateSchema),
        defaultValues: { first_name: '', last_name: '', third_name: '', kafedra_id: 0, username: '', password: '' },
    });

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
