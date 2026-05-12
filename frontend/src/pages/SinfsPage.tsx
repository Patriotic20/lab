import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, Plus, Pencil, Trash2, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Combobox } from '@/components/ui/Combobox';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import PermissionGate from '@/components/auth/PermissionGate';
import {
    useSinfs,
    useCreateSinf,
    useUpdateSinf,
    useDeleteSinf,
} from '@/hooks/useSinf';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { useGroups } from '@/hooks/useGroups';
import { useAcademicYears } from '@/hooks/useAcademicYear';
import type { Sinf, SinfCreateRequest, SinfUpdateRequest } from '@/services/sinfService';

const PAGE_SIZE = 12;

export default function SinfsPage() {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const isAdmin = user?.roles?.some((r) => r.name.toLowerCase() === 'admin');

    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useSinfs({ page, limit: PAGE_SIZE });

    const createMutation = useCreateSinf();
    const updateMutation = useUpdateSinf();
    const deleteMutation = useDeleteSinf();

    const { data: teachersData } = useTeachers(1, 500, undefined, hasPermission('read:teacher'));
    const { data: subjectsData } = useSubjects(1, 500, '', undefined, hasPermission('read:subject'));
    const { data: groupsData } = useGroups(1, 1000, '', undefined, undefined, hasPermission('read:group'));
    const { data: yearsData } = useAcademicYears(undefined, hasPermission('read:academic_year'));

    const yearOptions = useMemo(
        () =>
            (yearsData?.years ?? []).map((y) => ({ value: y.id.toString(), label: y.name })),
        [yearsData],
    );

    const teacherOptions = useMemo(
        () =>
            (teachersData?.teachers ?? []).map((t) => ({
                value: t.user_id.toString(),
                label: `${t.full_name} (${t.user?.username ?? '?'})`,
            })),
        [teachersData],
    );
    const subjectOptions = useMemo(
        () =>
            (subjectsData?.subjects ?? []).map((s) => ({
                value: s.id.toString(),
                label: s.name,
            })),
        [subjectsData],
    );
    const groupOptions = useMemo(
        () =>
            (groupsData?.groups ?? []).map((g) => ({
                value: g.id.toString(),
                label: g.name,
            })),
        [groupsData],
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Sinf | null>(null);
    const [formName, setFormName] = useState('');
    const [formSubjectId, setFormSubjectId] = useState('');
    const [formTeacherId, setFormTeacherId] = useState('');
    const [formYearId, setFormYearId] = useState('');
    const [formSemester, setFormSemester] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formGroupIds, setFormGroupIds] = useState<number[]>([]);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<Sinf | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormName('');
        setFormSubjectId('');
        setFormTeacherId('');
        setFormYearId('');
        setFormSemester('');
        setFormDescription('');
        setFormGroupIds([]);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (sinf: Sinf) => {
        setEditing(sinf);
        setFormName(sinf.name);
        setFormSubjectId(sinf.subject_id.toString());
        setFormTeacherId(sinf.teacher_id.toString());
        setFormYearId(sinf.academic_year_id ? sinf.academic_year_id.toString() : '');
        setFormSemester(sinf.semester_number ? sinf.semester_number.toString() : '');
        setFormDescription(sinf.description ?? '');
        setFormGroupIds(sinf.groups.map((g) => g.id));
        setFormError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const handleToggleGroup = (groupId: number) => {
        setFormGroupIds((prev) =>
            prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
        );
    };

    const validate = (): string => {
        if (!formName.trim()) return 'Nomi bo\'sh bo\'lmasligi kerak';
        if (!formSubjectId) return 'Fan tanlanmagan';
        if (!formTeacherId) return 'O\'qituvchi tanlanmagan';
        if (formGroupIds.length === 0) return 'Kamida bitta guruh tanlang';
        return '';
    };

    const handleSubmit = () => {
        const err = validate();
        if (err) {
            setFormError(err);
            return;
        }
        const yearIdNum = formYearId ? parseInt(formYearId, 10) : null;
        const semNum = formSemester ? (parseInt(formSemester, 10) as 1 | 2) : null;

        if (editing) {
            const payload: SinfUpdateRequest = {
                name: formName.trim(),
                subject_id: parseInt(formSubjectId, 10),
                teacher_id: parseInt(formTeacherId, 10),
                academic_year_id: yearIdNum,
                semester_number: semNum,
                description: formDescription.trim() || null,
                group_ids: formGroupIds,
            };
            updateMutation.mutate(
                { id: editing.id, data: payload },
                {
                    onSuccess: closeModal,
                    onError: () => setFormError('Xatolik yuz berdi'),
                },
            );
        } else {
            const payload: SinfCreateRequest = {
                name: formName.trim(),
                subject_id: parseInt(formSubjectId, 10),
                teacher_id: parseInt(formTeacherId, 10),
                academic_year_id: yearIdNum,
                semester_number: semNum,
                description: formDescription.trim() || null,
                group_ids: formGroupIds,
            };
            createMutation.mutate(payload, {
                onSuccess: closeModal,
                onError: () => setFormError('Xatolik yuz berdi'),
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    };

    const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Sinflar</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {isAdmin
                                ? 'Barcha sinflar — guruhlar, o\'qituvchilar va darslarni boshqarish'
                                : 'Mening sinflarim — darslar va resurslarni boshqarish'}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi sinf
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : isError ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-destructive">
                        <GraduationCap className="mb-4 h-14 w-14 opacity-30" />
                        <h3 className="text-lg font-semibold">Yuklab bo'lmadi</h3>
                    </CardContent>
                </Card>
            ) : !data || data.sinfs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <GraduationCap className="mb-4 h-14 w-14 opacity-30" />
                        <h3 className="text-lg font-semibold">Sinflar mavjud emas</h3>
                        <p className="text-sm mt-1">
                            {isAdmin ? 'Birinchi sinfni yarating.' : 'Sizga hali sinf tayinlanmagan.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.sinfs.map((sinf) => (
                        <Card
                            key={sinf.id}
                            className="flex flex-col cursor-pointer transition hover:border-primary"
                            onClick={() => navigate(`/sinfs/${sinf.id}`)}
                        >
                            <CardContent className="pt-6 flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-foreground truncate">{sinf.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {sinf.subject?.name ?? `Fan #${sinf.subject_id}`}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(sinf);
                                                }}
                                                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                title="Tahrirlash"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(sinf);
                                                }}
                                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                title="O'chirish"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    <span className="truncate">
                                        {sinf.teacher?.full_name ?? sinf.teacher?.username ?? `O'qituvchi #${sinf.teacher_id}`}
                                    </span>
                                </div>

                                {(sinf.academic_year || sinf.semester_number) && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        {sinf.academic_year && <span>{sinf.academic_year.name}</span>}
                                        {sinf.academic_year && sinf.semester_number && <span>·</span>}
                                        {sinf.semester_number && <span>{sinf.semester_number}-semestr</span>}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-xs">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">Guruhlar:</span>
                                    <span className="font-medium">{sinf.groups.length}</span>
                                </div>

                                {sinf.groups.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {sinf.groups.slice(0, 4).map((g) => (
                                            <span
                                                key={g.id}
                                                className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                                            >
                                                {g.name}
                                            </span>
                                        ))}
                                        {sinf.groups.length > 4 && (
                                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground">
                                                +{sinf.groups.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {sinf.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                                        {sinf.description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {data && data.total > PAGE_SIZE && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Sinfni tahrirlash' : 'Yangi sinf'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Nomi</label>
                        <Input
                            placeholder="Masalan: 4-kurs Matematika"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                        />
                    </div>
                    <PermissionGate permission="read:subject">
                        <div>
                            <label className="text-sm font-medium block mb-1">Fan</label>
                            <Combobox
                                options={subjectOptions}
                                value={formSubjectId}
                                onChange={setFormSubjectId}
                                placeholder="Fan tanlang..."
                            />
                        </div>
                    </PermissionGate>
                    <PermissionGate permission="read:teacher">
                        <div>
                            <label className="text-sm font-medium block mb-1">O'qituvchi</label>
                            <Combobox
                                options={teacherOptions}
                                value={formTeacherId}
                                onChange={setFormTeacherId}
                                placeholder="O'qituvchi tanlang..."
                            />
                        </div>
                    </PermissionGate>
                    <div className="grid grid-cols-2 gap-2">
                        <PermissionGate permission="read:academic_year">
                            <div>
                                <label className="text-sm font-medium block mb-1">O'quv yili</label>
                                <Combobox
                                    options={[{ value: '', label: '—' }, ...yearOptions]}
                                    value={formYearId}
                                    onChange={setFormYearId}
                                    placeholder="Tanlang"
                                />
                            </div>
                        </PermissionGate>
                        <div>
                            <label className="text-sm font-medium block mb-1">Semestr</label>
                            <Combobox
                                options={[
                                    { value: '', label: '—' },
                                    { value: '1', label: '1-semestr' },
                                    { value: '2', label: '2-semestr' },
                                ]}
                                value={formSemester}
                                onChange={setFormSemester}
                                placeholder="Tanlang"
                            />
                        </div>
                    </div>
                    <PermissionGate permission="read:group">
                    <div>
                        <label className="text-sm font-medium block mb-1">Guruhlar</label>
                        <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                            {groupOptions.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-2 py-1">Guruhlar yo'q</p>
                            ) : (
                                groupOptions.map((opt) => {
                                    const gid = parseInt(opt.value, 10);
                                    const checked = formGroupIds.includes(gid);
                                    return (
                                        <label
                                            key={opt.value}
                                            className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleToggleGroup(gid)}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">{opt.label}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {formGroupIds.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Tanlangan: {formGroupIds.length}
                            </p>
                        )}
                    </div>
                    </PermissionGate>
                    <div>
                        <label className="text-sm font-medium block mb-1">Tavsif (ixtiyoriy)</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Qisqacha izoh..."
                        />
                    </div>
                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={closeModal} disabled={isPending}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Saqlash' : 'Qo\'shish'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Sinfni o'chirish"
                description={`"${deleteTarget?.name}" sinfini o'chirmoqchimisiz? Sinfga bog'langan darslar va resurslar saqlanadi, lekin sinfdan ajraladi.`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
}
