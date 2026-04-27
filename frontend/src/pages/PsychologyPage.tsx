import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useMethods, useCreateMethod, useUpdateMethod, useDeleteMethod,
    useCreateQuestion, useUpdateQuestion, useDeleteQuestion,
} from '@/hooks/usePsychology';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import {
    Plus, Trash2, Edit2, Loader2, Brain, ChevronRight, Play,
    X, ListOrdered, AlignLeft, ToggleLeft, SlidersHorizontal, Image,
    Upload,
} from 'lucide-react';
import { MethodBuilderModal } from '@/components/psychology/MethodBuilderModal';
import { ExcelImportModal } from '@/components/psychology/ExcelImportModal';
import type { MethodResponse, QuestionResponse, QuestionType } from '@/services/psychologyService';

// ── Constants ──────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    text: 'Matnli savol',
    true_false: "Ha / Yo'q",
    scale: 'Shkala',
    image_stimulus: 'Rasm + matnli variantlar',
    image_choice: 'Rasmli variantlar',
};

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ElementType> = {
    text: AlignLeft,
    true_false: ToggleLeft,
    scale: SlidersHorizontal,
    image_stimulus: Image,
    image_choice: Image,
};

// ── Sub-components ─────────────────────────────────────────────────────────

function QuestionTypeBadge({ type }: { type: QuestionType }) {
    const Icon = QUESTION_TYPE_ICONS[type];
    const colors: Record<QuestionType, string> = {
        text: 'bg-blue-100 text-blue-700',
        true_false: 'bg-green-100 text-green-700',
        scale: 'bg-purple-100 text-purple-700',
        image_stimulus: 'bg-orange-100 text-orange-700',
        image_choice: 'bg-pink-100 text-pink-700',
    };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors[type]}`}>
            <Icon className="h-3 w-3" />
            {QUESTION_TYPE_LABELS[type]}
        </span>
    );
}

// ── Question Form ──────────────────────────────────────────────────────────

interface OptionRow { text?: string; image_url?: string; value: number | string; [key: string]: unknown }

interface QuestionFormState {
    question_type: QuestionType;
    // text / true_false
    textContent: string;
    // scale extras
    scaleMin: string;
    scaleMax: string;
    scaleMinLabel: string;
    scaleMaxLabel: string;
    // image_stimulus
    imageUrl: string;
    // options (text/image_stimulus/image_choice)
    options: OptionRow[];
    order: string;
    category: string;
}

const emptyQuestionForm = (): QuestionFormState => ({
    question_type: 'text',
    textContent: '',
    scaleMin: '1',
    scaleMax: '5',
    scaleMinLabel: '',
    scaleMaxLabel: '',
    imageUrl: '',
    options: [{ text: '', value: 1 }, { text: '', value: 0 }],
    order: '0',
    category: '',
});

function questionToForm(q: QuestionResponse): QuestionFormState {
    const c = q.content as Record<string, unknown>;
    const opts = (q.options as OptionRow[] | null) ?? [];
    return {
        question_type: q.question_type as QuestionType,
        textContent: (c.text as string) ?? '',
        scaleMin: String(c.min ?? 1),
        scaleMax: String(c.max ?? 5),
        scaleMinLabel: (c.min_label as string) ?? '',
        scaleMaxLabel: (c.max_label as string) ?? '',
        imageUrl: (c.image_url as string) ?? '',
        options: opts.length > 0 ? opts : [{ text: '', value: 1 }],
        order: String(q.order),
        category: q.category ?? '',
    };
}

function buildQuestionPayload(form: QuestionFormState) {
    const type = form.question_type;
    let content: Record<string, unknown> = {};
    let options: OptionRow[] | null = null;

    if (type === 'text') {
        content = { text: form.textContent };
        options = form.options.filter(o => String(o.text ?? '').trim());
    } else if (type === 'true_false') {
        content = { text: form.textContent };
    } else if (type === 'scale') {
        content = {
            text: form.textContent,
            min: Number(form.scaleMin),
            max: Number(form.scaleMax),
            ...(form.scaleMinLabel && { min_label: form.scaleMinLabel }),
            ...(form.scaleMaxLabel && { max_label: form.scaleMaxLabel }),
        };
    } else if (type === 'image_stimulus') {
        content = { image_url: form.imageUrl, text: form.textContent };
        options = form.options.filter(o => String(o.text ?? '').trim());
    } else if (type === 'image_choice') {
        content = { text: form.textContent };
        options = form.options.filter(o => String(o.image_url ?? '').trim());
    }
    return {
        content,
        options: options?.length ? options : null,
        order: Number(form.order),
        category: form.category.trim() || null,
    };
}

function getMethodCategories(method: MethodResponse): string[] {
    const scoring = (method.instruction as { scoring?: { method?: string; categories?: Record<string, unknown> } } | null)?.scoring;
    if (!scoring || scoring.method !== 'category') return [];
    const cats = scoring.categories;
    if (!cats || typeof cats !== 'object') return [];
    return Object.keys(cats);
}

function QuestionForm({
    form,
    onChange,
    methodCategories,
}: {
    form: QuestionFormState;
    onChange: (f: QuestionFormState) => void;
    methodCategories: string[];
}) {
    const set = (patch: Partial<QuestionFormState>) => onChange({ ...form, ...patch });

    const updateOption = (i: number, patch: Partial<OptionRow>) => {
        const opts = form.options.map((o, idx) => idx === i ? { ...o, ...patch } : o);
        set({ options: opts });
    };
    const addOption = () => set({ options: [...form.options, { text: '', image_url: '', value: form.options.length }] });
    const removeOption = (i: number) => set({ options: form.options.filter((_, idx) => idx !== i) });

    return (
        <div className="flex flex-col gap-4">
            {/* Type selector */}
            <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Savol turi</label>
                <Combobox
                    options={(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(t => ({
                        value: t,
                        label: QUESTION_TYPE_LABELS[t],
                    }))}
                    value={form.question_type}
                    onChange={(val) => { if (val) set({ question_type: val as QuestionType }); }}
                    placeholder="Savol turini tanlang..."
                    searchPlaceholder="Qidirish..."
                />
            </div>

            {/* Text / statement */}
            {(form.question_type !== 'image_choice') && (
                <Input
                    label={form.question_type === 'true_false' ? 'Bayonot' : 'Savol matni'}
                    value={form.textContent}
                    onChange={e => set({ textContent: e.target.value })}
                    placeholder="Savol yoki bayonot kiriting..."
                />
            )}

            {/* image_stimulus: upload image */}
            {form.question_type === 'image_stimulus' && (
                <ImageUploadField
                    label="Rasm"
                    value={form.imageUrl}
                    onChange={(url) => set({ imageUrl: url ?? '' })}
                />
            )}

            {/* scale fields */}
            {form.question_type === 'scale' && (
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Min" type="number" value={form.scaleMin} onChange={e => set({ scaleMin: e.target.value })} />
                    <Input label="Max" type="number" value={form.scaleMax} onChange={e => set({ scaleMax: e.target.value })} />
                    <Input label="Min belgisi" value={form.scaleMinLabel} onChange={e => set({ scaleMinLabel: e.target.value })} placeholder="masalan: Hech qachon" />
                    <Input label="Max belgisi" value={form.scaleMaxLabel} onChange={e => set({ scaleMaxLabel: e.target.value })} placeholder="masalan: Har doim" />
                </div>
            )}

            {/* Options for text / image_stimulus / image_choice */}
            {(form.question_type === 'text' || form.question_type === 'image_stimulus' || form.question_type === 'image_choice') && (
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Javob variantlari</label>
                        <button type="button" onClick={addOption} className="text-xs text-primary hover:underline">+ Qo'shish</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {form.options.map((opt, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                {form.question_type === 'image_choice' ? (
                                    <div className="flex-1">
                                        <ImageUploadField
                                            value={String(opt.image_url ?? '') || null}
                                            onChange={(url) => updateOption(i, { image_url: url ?? '' })}
                                            previewSize={56}
                                            helperText=""
                                        />
                                    </div>
                                ) : (
                                    <Input label="" placeholder={`Variant ${i + 1}`} value={String(opt.text ?? '')} onChange={e => updateOption(i, { text: e.target.value })} className="flex-1" />
                                )}
                                <Input label="" type="number" placeholder="Qiymat" value={String(opt.value)} onChange={e => updateOption(i, { value: Number(e.target.value) })} className="w-20 shrink-0" />
                                <button type="button" onClick={() => removeOption(i)} className="text-destructive shrink-0"><X className="h-4 w-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order */}
            <Input label="Tartib raqami" type="number" value={form.order} onChange={e => set({ order: e.target.value })} />

            {/* Category — only when method has 2+ categories.
                If category is already set (the create button was scoped to a section),
                show a read-only chip; otherwise let the user pick one. */}
            {methodCategories.length >= 2 && (
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Kategoriya</label>
                    {form.category ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {form.category}
                        </span>
                    ) : (
                        <select
                            value={form.category}
                            onChange={e => set({ category: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">— Tanlanmagan —</option>
                            {methodCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </div>
    );
}


// ── Question row ───────────────────────────────────────────────────────────

function QuestionRow({
    question,
    index,
    showCategoryBadge,
    onEdit,
    onDelete,
    deleteArmed,
    deletePending,
}: {
    question: QuestionResponse;
    index: number;
    showCategoryBadge: boolean;
    onEdit: () => void;
    onDelete: () => void;
    deleteArmed: boolean;
    deletePending: boolean;
}) {
    const c = question.content as Record<string, unknown>;
    const label = (c.text as string) || (c.image_url as string) || '—';
    return (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span>
            <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-foreground">{label}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <QuestionTypeBadge type={question.question_type as QuestionType} />
                    {question.options && <span className="text-xs text-muted-foreground">{question.options.length} variant</span>}
                    {showCategoryBadge && question.category && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {question.category}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex shrink-0 gap-1">
                <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                <button
                    onClick={onDelete}
                    className={`rounded-lg p-1.5 transition-colors ${deleteArmed ? 'bg-destructive text-white' : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}`}
                >
                    {deletePending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    );
}

// ── Questions SlideOver ────────────────────────────────────────────────────

function QuestionsPanel({
    method,
    onClose,
}: {
    method: MethodResponse;
    onClose: () => void;
}) {
    const createQ = useCreateQuestion();
    const updateQ = useUpdateQuestion();
    const deleteQ = useDeleteQuestion();

    const [qModal, setQModal] = useState<{ open: boolean; editing: QuestionResponse | null }>({ open: false, editing: null });
    const [qForm, setQForm] = useState<QuestionFormState>(emptyQuestionForm());
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [importTarget, setImportTarget] = useState<{ category: string | null } | null>(null);
    // Sticky type — remembered across "Savol qo'shish" clicks so the user only
    // picks the question type once per batch. Reset is manual (re-select in form).
    const [lastQuestionType, setLastQuestionType] = useState<QuestionType>('text');

    const openCreate = (category: string = '') => {
        setQForm({ ...emptyQuestionForm(), question_type: lastQuestionType, category });
        setQModal({ open: true, editing: null });
    };
    const openEdit = (q: QuestionResponse) => { setQForm(questionToForm(q)); setQModal({ open: true, editing: q }); };

    const methodCategories = getMethodCategories(method);
    const grouped = methodCategories.length >= 2;

    const sections: { key: string; label: string; items: QuestionResponse[] }[] = grouped
        ? [
            ...methodCategories.map(cat => ({
                key: cat,
                label: cat,
                items: method.questions.filter(q => (q.category ?? '').trim() === cat),
            })),
            {
                key: '__none__',
                label: 'Kategoriyasiz',
                items: method.questions.filter(q => !(q.category ?? '').trim()),
            },
        ].filter(sec => sec.key !== '__none__' || sec.items.length > 0)
        : [];

    const handleSaveQuestion = () => {
        const { content, options, order, category } = buildQuestionPayload(qForm);
        if (qModal.editing) {
            updateQ.mutate({ id: qModal.editing.id, data: { question_type: qForm.question_type, content, options, order, category } }, {
                onSuccess: () => setQModal({ open: false, editing: null }),
            });
        } else {
            createQ.mutate({ method_id: method.id, question_type: qForm.question_type, content, options, order, category }, {
                onSuccess: () => {
                    setLastQuestionType(qForm.question_type);
                    setQModal({ open: false, editing: null });
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        deleteQ.mutate(id, { onSuccess: () => setDeleteId(null) });
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-card shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-foreground">{method.name}</h2>
                        <p className="text-xs text-muted-foreground">{method.questions.length} ta savol</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!grouped && (
                            <>
                                <Button size="sm" variant="outline" onClick={() => setImportTarget({ category: null })}>
                                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Excel
                                </Button>
                                <Button size="sm" onClick={() => openCreate()}>
                                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Savol qo'shish
                                </Button>
                            </>
                        )}
                        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
                    </div>
                </div>

                {/* Questions list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {method.questions.length === 0 && !grouped ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                            <ListOrdered className="h-8 w-8 opacity-30" />
                            <p className="text-sm">Savollar mavjud emas</p>
                            <button onClick={() => openCreate()} className="text-xs text-primary hover:underline">Birinchi savolni qo'shing</button>
                        </div>
                    ) : grouped ? (
                        <div className="flex flex-col gap-5">
                            {sections.map(section => {
                                const isUncat = section.key === '__none__';
                                return (
                                    <div key={section.key} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
                                                <span className="text-xs text-muted-foreground">{section.items.length} ta</span>
                                            </div>
                                            {!isUncat && (
                                                <div className="flex items-center gap-1.5">
                                                    <Button size="sm" variant="outline" onClick={() => setImportTarget({ category: section.key })} title="Excel orqali import">
                                                        <Upload className="mr-1.5 h-3.5 w-3.5" /> Excel
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => openCreate(section.key)}>
                                                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Savol qo'shish
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {section.items.length === 0 ? (
                                            <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-center text-xs text-muted-foreground">
                                                Bu kategoriyada savollar yo'q
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {section.items.map((q, idx) => (
                                                    <QuestionRow
                                                        key={q.id}
                                                        question={q}
                                                        index={idx}
                                                        showCategoryBadge={false}
                                                        onEdit={() => openEdit(q)}
                                                        onDelete={() => deleteId === q.id ? handleDelete(q.id) : setDeleteId(q.id)}
                                                        deleteArmed={deleteId === q.id}
                                                        deletePending={deleteQ.isPending && deleteId === q.id}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {method.questions.map((q, idx) => (
                                <QuestionRow
                                    key={q.id}
                                    question={q}
                                    index={idx}
                                    showCategoryBadge={true}
                                    onEdit={() => openEdit(q)}
                                    onDelete={() => deleteId === q.id ? handleDelete(q.id) : setDeleteId(q.id)}
                                    deleteArmed={deleteId === q.id}
                                    deletePending={deleteQ.isPending && deleteId === q.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Question modal */}
            <Modal
                isOpen={qModal.open}
                onClose={() => setQModal({ open: false, editing: null })}
                title={qModal.editing ? 'Savolni tahrirlash' : 'Yangi savol'}
            >
                <div className="flex flex-col gap-4">
                    <QuestionForm form={qForm} onChange={setQForm} methodCategories={methodCategories} />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setQModal({ open: false, editing: null })}>Bekor</Button>
                        <Button onClick={handleSaveQuestion} disabled={createQ.isPending || updateQ.isPending}>
                            {(createQ.isPending || updateQ.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {qModal.editing ? 'Saqlash' : 'Qo\'shish'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Excel import modal */}
            <ExcelImportModal
                open={importTarget !== null}
                onClose={() => setImportTarget(null)}
                methodId={method.id}
                category={importTarget?.category ?? null}
                nextOrder={
                    method.questions.length === 0
                        ? 1
                        : Math.max(...method.questions.map(q => q.order)) + 1
                }
            />
        </>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function PsychologyPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useMethods(page, 20);
    const createMethod = useCreateMethod();
    const updateMethod = useUpdateMethod();
    const deleteMethod = useDeleteMethod();

    const [methodModal, setMethodModal] = useState<{ open: boolean; editing: MethodResponse | null }>({ open: false, editing: null });
    const [activeMethod, setActiveMethod] = useState<MethodResponse | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleCreate = (payload: Parameters<typeof createMethod.mutate>[0]) => {
        createMethod.mutate(payload, { onSuccess: () => setMethodModal({ open: false, editing: null }) });
    };
    const handleUpdate = (payload: { name: string; description: string; instruction: Record<string, unknown> }) => {
        if (!methodModal.editing) return;
        updateMethod.mutate({ id: methodModal.editing.id, data: payload }, {
            onSuccess: () => setMethodModal({ open: false, editing: null }),
        });
    };
    const handleDelete = (id: number) => {
        deleteMethod.mutate(id, { onSuccess: () => setDeletingId(null) });
    };

    // Sync activeMethod with fresh data
    const freshActive = activeMethod
        ? data?.methods.find(m => m.id === activeMethod.id) ?? activeMethod
        : null;

    return (
        <div className="p-6">
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Psixologik metodlar</h1>
                        <p className="text-xs text-muted-foreground">Test metodlarini boshqarish</p>
                    </div>
                </div>
                <Button onClick={() => setMethodModal({ open: true, editing: null })}>
                    <Plus className="mr-2 h-4 w-4" /> Yangi metod
                </Button>
            </div>

            {/* Content */}
            <Card>
                <CardHeader className="pb-0">
                    <p className="text-sm text-muted-foreground">
                        Jami: <span className="font-medium text-foreground">{data?.total ?? 0}</span> ta metod
                    </p>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <p className="py-8 text-center text-sm text-destructive">Xatolik yuz berdi</p>
                    ) : !data?.methods.length ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <Brain className="h-10 w-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Metodlar mavjud emas</p>
                            <button
                                onClick={() => setMethodModal({ open: true, editing: null })}
                                className="text-xs text-primary hover:underline"
                            >
                                Birinchi metodni yarating
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 flex flex-col gap-2">
                                {data.methods.map(method => (
                                    <div
                                        key={method.id}
                                        className="flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/30"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <Brain className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{method.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{method.description}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                            <ListOrdered className="h-3.5 w-3.5" />
                                            <span>{method.questions.length} savol</span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                onClick={() => navigate(`/psychology/test/${method.id}`)}
                                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                                                title="Testni boshlash"
                                            >
                                                <Play className="h-3.5 w-3.5" /> Test
                                            </button>
                                            <button
                                                onClick={() => setActiveMethod(method)}
                                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                Savollar <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setMethodModal({ open: true, editing: method })}
                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deletingId === method.id ? handleDelete(method.id) : setDeletingId(method.id)}
                                                className={`rounded-lg p-1.5 transition-colors ${
                                                    deletingId === method.id
                                                        ? 'bg-destructive text-white'
                                                        : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                                                }`}
                                                title={deletingId === method.id ? 'Tasdiqlash uchun yana bosing' : "O'chirish"}
                                            >
                                                {deleteMethod.isPending && deletingId === method.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {data.total > 20 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={page}
                                        totalPages={Math.ceil(data.total / 20)}
                                        onPageChange={setPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Method modal */}
            {methodModal.open && (
                <MethodBuilderModal
                    open={methodModal.open}
                    editing={methodModal.editing}
                    onClose={() => setMethodModal({ open: false, editing: null })}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                    isPending={createMethod.isPending || updateMethod.isPending}
                />
            )}

            {/* Questions slide-over */}
            {freshActive && (
                <QuestionsPanel
                    method={freshActive}
                    onClose={() => setActiveMethod(null)}
                />
            )}
        </div>
    );
}
