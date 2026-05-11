import { useState } from 'react';
import { Calendar, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import {
    useAcademicYears,
    useCreateAcademicYear,
    useUpdateAcademicYear,
    useDeleteAcademicYear,
} from '@/hooks/useAcademicYear';
import type { AcademicYear } from '@/services/academicYearService';

export default function AcademicYearsPage() {
    const { user } = useAuth();
    const isAdmin = user?.roles?.some((r) => r.name.toLowerCase() === 'admin');

    const { data, isLoading, isError } = useAcademicYears();
    const createMut = useCreateAcademicYear();
    const updateMut = useUpdateAcademicYear();
    const deleteMut = useDeleteAcademicYear();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AcademicYear | null>(null);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [sem1Start, setSem1Start] = useState('');
    const [sem1End, setSem1End] = useState('');
    const [sem2Start, setSem2Start] = useState('');
    const [sem2End, setSem2End] = useState('');
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);

    const openCreate = () => {
        setEditing(null);
        setName('');
        setStartDate('');
        setEndDate('');
        setIsActive(false);
        setSem1Start('');
        setSem1End('');
        setSem2Start('');
        setSem2End('');
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (y: AcademicYear) => {
        setEditing(y);
        setName(y.name);
        setStartDate(y.start_date);
        setEndDate(y.end_date);
        setIsActive(y.is_active);
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setFormError('Nom kiriting');
            return;
        }
        if (!startDate || !endDate) {
            setFormError('Sanalarni kiriting');
            return;
        }

        if (editing) {
            updateMut.mutate(
                {
                    id: editing.id,
                    data: { name: name.trim(), start_date: startDate, end_date: endDate, is_active: isActive },
                },
                { onSuccess: () => setModalOpen(false), onError: () => setFormError('Xatolik yuz berdi') },
            );
        } else {
            const semesters = [];
            if (sem1Start && sem1End) {
                semesters.push({ number: 1 as const, start_date: sem1Start, end_date: sem1End });
            }
            if (sem2Start && sem2End) {
                semesters.push({ number: 2 as const, start_date: sem2Start, end_date: sem2End });
            }
            createMut.mutate(
                {
                    name: name.trim(),
                    start_date: startDate,
                    end_date: endDate,
                    is_active: isActive,
                    semesters,
                },
                { onSuccess: () => setModalOpen(false), onError: () => setFormError('Xatolik yuz berdi') },
            );
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    };

    const isPending = createMut.isPending || updateMut.isPending;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">O'quv yili</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            O'quv yillari va semestrlarni boshqarish
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi yil
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : isError ? (
                <p className="py-6 text-center text-sm text-destructive">Yuklab bo'lmadi</p>
            ) : !data || data.years.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        O'quv yillari yo'q
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.years.map((y) => (
                        <Card key={y.id} className={y.is_active ? 'border-primary' : ''}>
                            <CardContent className="pt-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{y.name}</h3>
                                            {y.is_active && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                                    Joriy
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {y.start_date} — {y.end_date}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEdit(y)}
                                                className="rounded p-1 text-muted-foreground hover:bg-accent"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(y)}
                                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 pt-1">
                                    {y.semesters.map((s) => (
                                        <div key={s.id} className="text-xs flex justify-between">
                                            <span className="text-muted-foreground">{s.number}-semestr</span>
                                            <span>
                                                {s.start_date} — {s.end_date}
                                            </span>
                                        </div>
                                    ))}
                                    {y.semesters.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">Semestrlar yo'q</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? "O'quv yilini tahrirlash" : "Yangi o'quv yili"}
            >
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium block mb-1">Nomi</label>
                        <Input placeholder="2025-2026" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium block mb-1">Boshlanish</label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Tugash</label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="accent-primary"
                        />
                        Joriy yil (faqat bittasi)
                    </label>

                    {!editing && (
                        <>
                            <div className="pt-2 border-t border-border">
                                <p className="text-sm font-medium mb-2">1-semestr</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="date"
                                        value={sem1Start}
                                        onChange={(e) => setSem1Start(e.target.value)}
                                        placeholder="Boshlanish"
                                    />
                                    <Input
                                        type="date"
                                        value={sem1End}
                                        onChange={(e) => setSem1End(e.target.value)}
                                        placeholder="Tugash"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">2-semestr</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="date"
                                        value={sem2Start}
                                        onChange={(e) => setSem2Start(e.target.value)}
                                    />
                                    <Input
                                        type="date"
                                        value={sem2End}
                                        onChange={(e) => setSem2End(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Saqlash' : "Qo'shish"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="O'quv yilini o'chirish"
                description={`"${deleteTarget?.name}" o'quv yilini o'chirmoqchimisiz? Bog'liq semestrlar ham o'chiriladi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
}
