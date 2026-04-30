import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Plus, X } from 'lucide-react';
import { useCreateResource, useUpdateResource } from '@/hooks/useResources';
import type { Lesson } from '@/services/lessonService';
import type { ResourceLink, ResourceResponse } from '@/services/resourceService';

const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lesson: Lesson;
    editing?: ResourceResponse | null;
}

export const LessonResourceModal = ({ isOpen, onClose, lesson, editing }: Props) => {
    const createMutation = useCreateResource();
    const updateMutation = useUpdateResource();

    const [mainText, setMainText] = useState('');
    const [links, setLinks] = useState<ResourceLink[]>([{ title: '', url: '' }]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        if (editing) {
            setMainText(editing.main_text);
            setLinks(editing.links.length > 0 ? [...editing.links] : [{ title: '', url: '' }]);
        } else {
            setMainText('');
            setLinks([{ title: '', url: '' }]);
        }
        setError('');
    }, [isOpen, editing]);

    const handleLinkChange = (idx: number, field: keyof ResourceLink, value: string) => {
        setLinks(prev => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    const validate = () => {
        if (!mainText.trim()) return 'Asosiy matn bo\'sh bo\'lishi mumkin emas';
        for (const l of links) {
            if (l.title && l.url && !isValidUrl(l.url)) return `Noto'g'ri URL: ${l.url}`;
        }
        return '';
    };

    const handleSave = () => {
        const err = validate();
        if (err) { setError(err); return; }
        const cleanLinks = links.filter(l => l.title.trim() && l.url.trim());

        if (editing) {
            updateMutation.mutate(
                {
                    id: editing.id,
                    data: { main_text: mainText, links: cleanLinks },
                },
                { onSuccess: onClose, onError: () => setError('Xatolik yuz berdi') }
            );
        } else {
            createMutation.mutate(
                {
                    subject_teacher_id: lesson.subject_teacher_id,
                    group_id: lesson.group_id,
                    lesson_id: lesson.id,
                    main_text: mainText,
                    links: cleanLinks,
                },
                { onSuccess: onClose, onError: () => setError('Xatolik yuz berdi') }
            );
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Resursni tahrirlash' : 'Yangi resurs qo\'shish'}>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium block mb-1">Asosiy matn</label>
                    <textarea
                        className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Bu resurs haqida qisqacha izoh..."
                        value={mainText}
                        onChange={(e) => setMainText(e.target.value)}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium">Havolalar</label>
                        <button
                            type="button"
                            onClick={() => setLinks(prev => [...prev, { title: '', url: '' }])}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" /> Havola qo'shish
                        </button>
                    </div>
                    <div className="space-y-2">
                        {links.map((link, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Sarlavha (masalan: Video dars)"
                                    value={link.title}
                                    onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="URL (https://...)"
                                    value={link.url}
                                    onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                    className="flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setLinks(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-destructive hover:text-destructive/80 shrink-0"
                                    title="O'chirish"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Sarlavha va URL ikkisi ham bo'sh bo'lsa, saqlanmaydi.
                    </p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Bekor qilish</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editing ? 'Saqlash' : 'Qo\'shish'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
