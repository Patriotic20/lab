import { useState } from 'react';
import { ArrowRight, History, Loader2, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Combobox } from '@/components/ui/Combobox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import {
    useCreateStudentMovement,
    useDeleteStudentMovement,
    useStudentMovements,
} from '@/hooks/useStudentMovements';
import type { Student } from '@/services/studentService';
import type { MovementType, StudentMovement } from '@/services/studentMovementService';

const TYPE_LABEL: Record<MovementType, string> = {
    enrollment: 'Qabul',
    transfer: "Ko'chirish",
    leave: 'Akademik taʼtil',
    return: 'Qaytdi',
    expulsion: 'Chetlashtirildi',
    graduation: 'Bitirdi',
};

const TYPE_COLOR: Record<MovementType, string> = {
    enrollment: 'bg-emerald-500/10 text-emerald-700',
    transfer: 'bg-blue-500/10 text-blue-700',
    leave: 'bg-amber-500/10 text-amber-700',
    return: 'bg-sky-500/10 text-sky-700',
    expulsion: 'bg-red-500/10 text-red-700',
    graduation: 'bg-purple-500/10 text-purple-700',
};

interface Props {
    student: Student | null;
    onClose: () => void;
}

export function StudentMovementsModal({ student, onClose }: Props) {
    const { user, hasPermission } = useAuth();
    const isAdmin = user?.roles?.some((r) => r.name.toLowerCase() === 'admin');

    const { data, isLoading } = useStudentMovements(student?.id);
    const { data: groupsData } = useGroups(1, 500, '', undefined, undefined, hasPermission('read:group'));
    const createMut = useCreateStudentMovement();
    const deleteMut = useDeleteStudentMovement();

    const [formOpen, setFormOpen] = useState(false);
    const [type, setType] = useState<MovementType>('enrollment');
    const [toGroupId, setToGroupId] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [orderDate, setOrderDate] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<StudentMovement | null>(null);

    if (!student) return null;

    const groupOptions = (groupsData?.groups ?? []).map((g) => ({
        value: g.id.toString(),
        label: g.name,
    }));

    const resetForm = () => {
        setType('enrollment');
        setToGroupId('');
        setOrderNumber('');
        setOrderDate('');
        setEffectiveDate(new Date().toISOString().slice(0, 10));
        setReason('');
        setError('');
    };

    const submit = () => {
        if (!effectiveDate) {
            setError("Sana to'ldirilishi kerak");
            return;
        }
        if ((type === 'transfer' || type === 'enrollment' || type === 'return') && !toGroupId) {
            setError('Yangi guruh tanlanmagan');
            return;
        }

        createMut.mutate(
            {
                student_id: student.id,
                movement_type: type,
                from_group_id: student.group_id ?? null,
                to_group_id: toGroupId ? parseInt(toGroupId, 10) : null,
                order_number: orderNumber.trim() || null,
                order_date: orderDate || null,
                effective_date: effectiveDate,
                reason: reason.trim() || null,
            },
            {
                onSuccess: () => {
                    setFormOpen(false);
                    resetForm();
                },
                onError: () => setError("Saqlashda xatolik"),
            },
        );
    };

    return (
        <Modal
            isOpen={!!student}
            onClose={onClose}
            title={`${student.full_name} — harakatlar tarixi`}
            className="max-w-3xl"
        >
            <div className="space-y-3">
                {isAdmin && (
                    <div className="flex justify-end">
                        <Button
                            onClick={() => {
                                resetForm();
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Yangi harakat
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : !data || data.movements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <History className="h-10 w-10 opacity-30 mb-2" />
                        <p className="text-sm">Harakatlar yo'q</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.movements.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                                                TYPE_COLOR[m.movement_type as MovementType] ?? ''
                                            }`}
                                        >
                                            {TYPE_LABEL[m.movement_type as MovementType] ?? m.movement_type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {m.effective_date}
                                        </span>
                                        {m.order_number && (
                                            <span className="text-[11px] text-muted-foreground">
                                                Buyruq №{m.order_number}
                                                {m.order_date ? ` (${m.order_date})` : ''}
                                            </span>
                                        )}
                                    </div>
                                    {(m.from_group || m.to_group) && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-muted-foreground">
                                                {m.from_group?.name ?? '—'}
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-medium">{m.to_group?.name ?? '—'}</span>
                                        </div>
                                    )}
                                    {m.reason && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {m.reason}
                                        </p>
                                    )}
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setDeleteTarget(m)}
                                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={formOpen}
                    onClose={() => setFormOpen(false)}
                    title="Yangi harakat"
                >
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium block mb-1">Harakat turi</label>
                            <Combobox
                                options={(Object.keys(TYPE_LABEL) as MovementType[]).map((t) => ({
                                    value: t,
                                    label: TYPE_LABEL[t],
                                }))}
                                value={type}
                                onChange={(v) => setType(v as MovementType)}
                                placeholder="Tur tanlang"
                            />
                        </div>
                        {(type === 'enrollment' || type === 'transfer' || type === 'return') && (
                            <div>
                                <label className="text-sm font-medium block mb-1">Yangi guruh</label>
                                <Combobox
                                    options={groupOptions}
                                    value={toGroupId}
                                    onChange={setToGroupId}
                                    placeholder="Guruh tanlang"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-sm font-medium block mb-1">Amal qilish sanasi</label>
                                <Input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Buyruq sanasi</label>
                                <Input
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Buyruq raqami</label>
                            <Input
                                placeholder="Masalan: 124/2025"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Sabab</label>
                            <textarea
                                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setFormOpen(false)}>
                                Bekor qilish
                            </Button>
                            <Button onClick={submit} disabled={createMut.isPending}>
                                {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Qo'shish
                            </Button>
                        </div>
                    </div>
                </Modal>

                <ConfirmDialog
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={() => {
                        if (deleteTarget) {
                            deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
                        }
                    }}
                    title="Harakatni o'chirish"
                    description="Bu harakatni tarixdan o'chirmoqchimisiz? Talaba holati o'zgartirilmaydi."
                    confirmText="O'chirish"
                    cancelText="Bekor qilish"
                />
            </div>
        </Modal>
    );
}
