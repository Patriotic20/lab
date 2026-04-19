import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useResources, useCreateResource, useUpdateResource, useDeleteResource } from '@/hooks/useResources';
import { useTeachers } from '@/hooks/useTeachers';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import {
    Plus, Trash2, Edit2, Link2, BookOpen, ExternalLink, Loader2, X
} from 'lucide-react';
import type { ResourceResponse, ResourceLink, ResourceCreateRequest } from '@/services/resourceService';

// ── Helper to validate URL ──────────────────────────────────────────────────
const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
};

// ── Sub-component: Link editor row ─────────────────────────────────────────
function LinkRow({
    link,
    index,
    onChange,
    onRemove,
}: {
    link: ResourceLink;
    index: number;
    onChange: (index: number, field: keyof ResourceLink, value: string) => void;
    onRemove: (index: number) => void;
}) {
    return (
        <div className="flex gap-2 items-center">
            <Input
                label=""
                placeholder="Sarlavha (masalan: Video dars)"
                value={link.title}
                onChange={(e) => onChange(index, 'title', e.target.value)}
                className="flex-1"
            />
            <Input
                label=""
                placeholder="URL (https://...)"
                value={link.url}
                onChange={(e) => onChange(index, 'url', e.target.value)}
                className="flex-1"
            />
            <button
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive/80 mt-0.5 shrink-0"
                title="O'chirish"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function ResourcesPage() {
    const { user } = useAuth();
    const isAdmin = user?.roles?.some(r => r.name.toLowerCase() === 'admin');
    const isTeacher = user?.roles?.some(r => r.name.toLowerCase() === 'teacher');

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading, isError, error } = useResources(page, pageSize);
    const createMutation = useCreateResource();
    const updateMutation = useUpdateResource();
    const deleteMutation = useDeleteResource();

    // Teachers list for subject_teacher selection (admin only)
    const { data: teachersData } = useTeachers(1, 500, undefined, isAdmin);

    // ── Modal state ──────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<ResourceResponse | null>(null);

    const [formSubjectTeacherId, setFormSubjectTeacherId] = useState('');
    const [formMainText, setFormMainText] = useState('');
    const [formLinks, setFormLinks] = useState<ResourceLink[]>([{ title: '', url: '' }]);
    const [formError, setFormError] = useState('');

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<ResourceResponse | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingResource(null);
        setFormSubjectTeacherId('');
        setFormMainText('');
        setFormLinks([{ title: '', url: '' }]);
        setFormError('');
        setIsModalOpen(true);
    };

    const openEdit = (res: ResourceResponse) => {
        setEditingResource(res);
        setFormSubjectTeacherId(res.subject_teacher_id.toString());
        setFormMainText(res.main_text);
        setFormLinks(res.links.length > 0 ? [...res.links] : [{ title: '', url: '' }]);
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingResource(null);
    };

    const handleLinkChange = (idx: number, field: keyof ResourceLink, value: string) => {
        setFormLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
    };

    const handleAddLink = () => setFormLinks(prev => [...prev, { title: '', url: '' }]);

    const handleRemoveLink = (idx: number) =>
        setFormLinks(prev => prev.filter((_, i) => i !== idx));

    const validate = () => {
        if (!formMainText.trim()) return 'Asosiy matn bo\'sh bo\'lishi mumkin emas';
        if (!editingResource && !formSubjectTeacherId) return 'Fan/O\'qituvchi tanlanmagan';
        for (const l of formLinks) {
            if (l.title && l.url && !isValidUrl(l.url)) return `Noto'g'ri URL: ${l.url}`;
        }
        return '';
    };

    const handleSubmit = () => {
        const err = validate();
        if (err) { setFormError(err); return; }

        const cleanLinks = formLinks.filter(l => l.title.trim() && l.url.trim());

        if (editingResource) {
            updateMutation.mutate(
                { id: editingResource.id, data: { main_text: formMainText, links: cleanLinks } },
                { onSuccess: closeModal, onError: () => setFormError('Xatolik yuz berdi') }
            );
        } else {
            const payload: ResourceCreateRequest = {
                subject_teacher_id: parseInt(formSubjectTeacherId),
                main_text: formMainText,
                links: cleanLinks,
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

    const totalPages = data ? Math.ceil(data.total / pageSize) : 1;
    const isPending = createMutation.isPending || updateMutation.isPending;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Resurslar</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {isAdmin ? 'Barcha o\'quv resurslari' : 'Mening o\'quv resurslarim'}
                    </p>
                </div>
                {(isAdmin || isTeacher) && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yangi resurs
                    </Button>
                )}
            </div>

            {/* Resource cards */}
            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : isError ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <BookOpen className="mb-4 h-14 w-14 opacity-20 text-destructive" />
                        <h3 className="text-lg font-semibold text-destructive">Yuklab bo'lmadi</h3>
                        <p className="text-sm mt-1 text-muted-foreground">
                            {(error as any)?.response?.status === 403
                                ? 'Sizda bu sahifani ko\'rish uchun ruxsat yo\'q. Administrator bilan bog\'laning.'
                                : 'Server bilan bog\'lanishda xatolik yuz berdi. Qayta urinib ko\'ring.'}
                        </p>
                    </CardContent>
                </Card>
            ) : !data || data.resources.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <BookOpen className="mb-4 h-14 w-14 opacity-20" />
                        <h3 className="text-lg font-semibold">Resurslar yo'q</h3>
                        <p className="text-sm mt-1">Hozircha hech qanday o'quv resursi qo'shilmagan.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {data.resources.map(res => (
                        <Card key={res.id} className="flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                                        <span className="text-xs text-muted-foreground">
                                            Fan/O'qituvchi #{res.subject_teacher_id}
                                        </span>
                                    </div>
                                    {(isAdmin || isTeacher) && (
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => openEdit(res)}
                                                className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                                                title="Tahrirlash"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(res)}
                                                className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                title="O'chirish"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3">
                                {/* Main text */}
                                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                                    {res.main_text}
                                </p>

                                {/* Links */}
                                {res.links.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                            <Link2 className="h-3.5 w-3.5" />
                                            Havolalar
                                        </p>
                                        {res.links.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors group"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                                                <span className="truncate group-hover:text-primary transition-colors">
                                                    {link.title || link.url}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingResource ? 'Resursni tahrirlash' : 'Yangi resurs qo\'shish'}
            >
                <div className="space-y-4">
                    {/* subject_teacher selector — admin only when creating */}
                    {!editingResource && isAdmin && (
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Fan / O'qituvchi (subject_teacher_id)
                            </label>
                            <select
                                value={formSubjectTeacherId}
                                onChange={e => setFormSubjectTeacherId(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Tanlang...</option>
                                {(teachersData?.teachers || []).flatMap(t =>
                                    t.subject_teachers?.map((st: any) => (
                                        <option key={st.id} value={st.id}>
                                            #{st.id} — {t.full_name} / {st.subject?.name ?? '?'}
                                        </option>
                                    )) ?? []
                                )}
                            </select>
                        </div>
                    )}

                    {/* Main text */}
                    <div>
                        <label className="text-sm font-medium block mb-1">Asosiy matn</label>
                        <textarea
                            value={formMainText}
                            onChange={e => setFormMainText(e.target.value)}
                            rows={4}
                            placeholder="Bu resurs haqida qisqacha izoh..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Links */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Havolalar</label>
                            <button
                                onClick={handleAddLink}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Havola qo'shish
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formLinks.map((link, idx) => (
                                <LinkRow
                                    key={idx}
                                    link={link}
                                    index={idx}
                                    onChange={handleLinkChange}
                                    onRemove={handleRemoveLink}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sarlavha va URL ikkisi ham bo'sh bo'lsa, saqlanmaydi.
                        </p>
                    </div>

                    {formError && (
                        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {formError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={closeModal}>Bekor qilish</Button>
                        <Button onClick={handleSubmit} isLoading={isPending}>
                            {editingResource ? 'Saqlash' : 'Qo\'shish'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Resursni o'chirish"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Ushbu resursni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Bekor</Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={deleteMutation.isPending}
                        >
                            O'chirish
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
