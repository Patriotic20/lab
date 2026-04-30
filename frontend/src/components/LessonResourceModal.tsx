import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileText, Image as ImageIcon, Loader2, Paperclip, Plus, X } from 'lucide-react';
import { useCreateResource, useUpdateResource } from '@/hooks/useResources';
import type { Lesson } from '@/services/lessonService';
import { resourceService } from '@/services/resourceService';
import type { ResourceFile, ResourceLink, ResourceResponse } from '@/services/resourceService';

const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
};

const ALLOWED_MIME: Record<string, string> = {
    'image/jpeg': 'image', 'image/jpg': 'image', 'image/png': 'image',
    'image/gif': 'image', 'image/webp': 'image',
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};
const IMAGE_MAX = 5 * 1024 * 1024;
const DOC_MAX = 20 * 1024 * 1024;

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
    const [files, setFiles] = useState<ResourceFile[]>([]);
    const [uploading, setUploading] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (editing) {
            setMainText(editing.main_text);
            setLinks(editing.links.length > 0 ? [...editing.links] : [{ title: '', url: '' }]);
            setFiles(editing.files ?? []);
        } else {
            setMainText('');
            setLinks([{ title: '', url: '' }]);
            setFiles([]);
        }
        setError('');
        setFileError('');
    }, [isOpen, editing]);

    const handleLinkChange = (idx: number, field: keyof ResourceLink, value: string) => {
        setLinks(prev => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    };

    const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        if (!picked.length) return;
        setFileError('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        const toUpload: File[] = [];
        for (const f of picked) {
            if (!ALLOWED_MIME[f.type]) {
                setFileError(`Noto'g'ri tur: ${f.name}`);
                continue;
            }
            const max = f.type.startsWith('image/') ? IMAGE_MAX : DOC_MAX;
            if (f.size > max) {
                setFileError(`${f.name} — ${max / 1024 / 1024}MB dan oshmasligi kerak`);
                continue;
            }
            toUpload.push(f);
        }
        if (!toUpload.length) return;

        setUploading(p => [...p, ...toUpload.map(f => f.name)]);
        const results = await Promise.allSettled(toUpload.map(f => resourceService.uploadFile(f)));
        results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                setFiles(p => [...p, result.value]);
            } else {
                setFileError(`${toUpload[i].name} yuklanmadi`);
            }
        });
        setUploading(p => p.filter(n => !toUpload.map(f => f.name).includes(n)));
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
                { id: editing.id, data: { main_text: mainText, links: cleanLinks, files } },
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
                    files,
                },
                { onSuccess: onClose, onError: () => setError('Xatolik yuz berdi') }
            );
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending || uploading.length > 0;

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

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium">Fayllar</label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading.length > 0}
                            className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                            <Paperclip className="h-3 w-3" /> Fayl biriktirish
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFilePick}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.xlsx,.pptx"
                        multiple
                        className="hidden"
                    />
                    {uploading.map(name => (
                        <div key={name} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                            <span className="truncate">{name}</span>
                        </div>
                    ))}
                    {files.length > 0 && (
                        <div className="space-y-1 mt-1">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                                    {f.type === 'image'
                                        ? <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        : <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    }
                                    <span className="text-xs truncate flex-1">{f.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                                        className="text-destructive hover:text-destructive/80 shrink-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {fileError && <p className="text-xs text-destructive mt-1">{fileError}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                        Rasmlar: jpg, png, gif, webp (maks 5MB). Hujjatlar: pdf, docx, xlsx, pptx (maks 20MB).
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
