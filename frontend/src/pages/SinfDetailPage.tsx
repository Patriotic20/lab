import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock, ExternalLink,
    FileText, FolderTree, GraduationCap, Link2, Loader2, Pencil, Plus, Scroll, Send, Trash2, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Combobox } from '@/components/ui/Combobox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useSinf } from '@/hooks/useSinf';
import {
    useLessons,
    useCreateLesson,
    useUpdateLesson,
    useDeleteLesson,
} from '@/hooks/useLessons';
import {
    useResources,
    useCreateResource,
    useUpdateResource,
    useDeleteResource,
} from '@/hooks/useResources';
import {
    useCreateModule,
    useCreateTopic,
    useDeleteModule,
    useDeleteTopic,
    useModules,
    useUpdateModule,
    useUpdateTopic,
} from '@/hooks/useCourseStructure';
import type { Module, Topic } from '@/services/courseStructureService';
import { useSyllabus, useUpsertSyllabus } from '@/hooks/useSyllabus';
import type { LiteratureItem } from '@/services/syllabusService';
import {
    useAssignments,
    useCreateAssignment,
    useDeleteAssignment,
    useGradeSubmission,
    useMySubmission,
    useSubmissions,
    useSubmitAssignment,
    useUpdateAssignment,
} from '@/hooks/useAssignments';
import type { Assignment, Submission } from '@/services/assignmentService';
import type {
    Lesson,
    LessonCreateRequest,
    LessonType,
    LessonUpdateRequest,
} from '@/services/lessonService';

const LESSON_TYPE_LABEL: Record<LessonType, string> = {
    lecture: 'Maʼruza',
    seminar: 'Seminar',
    independent: 'Mustaqil',
    lab: 'Laboratoriya',
};
const LESSON_TYPE_COLOR: Record<LessonType, string> = {
    lecture: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    seminar: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    independent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    lab: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
};
import type {
    ResourceCreateRequest,
    ResourceLink,
    ResourceResponse,
    ResourceUpdateRequest,
} from '@/services/resourceService';

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

type Tab = 'lessons' | 'resources' | 'structure' | 'syllabus' | 'assignments';

export default function SinfDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const sinfId = id ? parseInt(id, 10) : undefined;
    const { user } = useAuth();
    const isAdmin = user?.roles?.some((r) => r.name.toLowerCase() === 'admin');

    const { data: sinf, isLoading: sinfLoading, isError: sinfError } = useSinf(sinfId);

    const isOwner = !!user && !!sinf && user.id === sinf.teacher_id;
    const canManage = !!isAdmin || isOwner;

    const [tab, setTab] = useState<Tab>('lessons');

    if (sinfLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    if (sinfError || !sinf) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-destructive">Sinf topilmadi</p>
                        <Button variant="outline" className="mt-4" onClick={() => navigate('/sinfs')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const sinfGroupOptions = sinf.groups.map((g) => ({
        value: g.id.toString(),
        label: g.name,
    }));
    const sinfGroupIds = new Set(sinf.groups.map((g) => g.id));

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => navigate('/sinfs')}
                        className="rounded p-2 hover:bg-accent text-muted-foreground"
                        title="Orqaga"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">{sinf.name}</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {sinf.subject?.name ?? `Fan #${sinf.subject_id}`}
                            {' · '}
                            {sinf.teacher?.full_name ?? sinf.teacher?.username ?? `O'qituvchi #${sinf.teacher_id}`}
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Guruhlar:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {sinf.groups.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Tayinlanmagan</span>
                        ) : (
                            sinf.groups.map((g) => (
                                <span
                                    key={g.id}
                                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                                >
                                    {g.name}
                                </span>
                            ))
                        )}
                    </div>
                    {sinf.description && (
                        <p className="text-sm text-muted-foreground pt-2">{sinf.description}</p>
                    )}
                </CardContent>
            </Card>

            <div className="flex border-b border-border">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                        tab === 'structure'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setTab('structure')}
                >
                    <FolderTree className="mr-1.5 inline h-4 w-4" />
                    Tuzilma
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                        tab === 'lessons'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setTab('lessons')}
                >
                    <BookOpen className="mr-1.5 inline h-4 w-4" />
                    Darslar
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                        tab === 'assignments'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setTab('assignments')}
                >
                    <ClipboardCheck className="mr-1.5 inline h-4 w-4" />
                    Topshiriqlar
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                        tab === 'resources'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setTab('resources')}
                >
                    <FileText className="mr-1.5 inline h-4 w-4" />
                    Resurslar
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                        tab === 'syllabus'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setTab('syllabus')}
                >
                    <Scroll className="mr-1.5 inline h-4 w-4" />
                    Sillabus
                </button>
            </div>

            {tab === 'structure' ? (
                <StructureTab sinfId={sinf.id} canManage={canManage} />
            ) : tab === 'lessons' ? (
                <LessonsTab sinfId={sinf.id} sinfGroupOptions={sinfGroupOptions} canManage={canManage} sinfGroupIds={sinfGroupIds} />
            ) : tab === 'assignments' ? (
                <AssignmentsTab sinfId={sinf.id} canManage={canManage} />
            ) : tab === 'resources' ? (
                <ResourcesTab sinfId={sinf.id} sinfGroupOptions={sinfGroupOptions} canManage={canManage} sinfGroupIds={sinfGroupIds} />
            ) : (
                <SyllabusTab sinfId={sinf.id} canManage={canManage} />
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function StructureTab({ sinfId, canManage }: { sinfId: number; canManage: boolean }) {
    const { data, isLoading } = useModules(sinfId);
    const createModule = useCreateModule(sinfId);
    const updateModule = useUpdateModule(sinfId);
    const deleteModule = useDeleteModule(sinfId);
    const createTopic = useCreateTopic(sinfId);
    const updateTopic = useUpdateTopic(sinfId);
    const deleteTopic = useDeleteTopic(sinfId);

    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [moduleEditing, setModuleEditing] = useState<Module | null>(null);
    const [moduleName, setModuleName] = useState('');
    const [moduleDescription, setModuleDescription] = useState('');

    const [topicModalOpen, setTopicModalOpen] = useState(false);
    const [topicEditing, setTopicEditing] = useState<Topic | null>(null);
    const [topicTargetModuleId, setTopicTargetModuleId] = useState<number | null>(null);
    const [topicName, setTopicName] = useState('');
    const [topicDescription, setTopicDescription] = useState('');
    const [topicHours, setTopicHours] = useState('');
    const [topicOutcomes, setTopicOutcomes] = useState('');

    const [deleteModuleTarget, setDeleteModuleTarget] = useState<Module | null>(null);
    const [deleteTopicTarget, setDeleteTopicTarget] = useState<Topic | null>(null);

    const toggle = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openModuleCreate = () => {
        setModuleEditing(null);
        setModuleName('');
        setModuleDescription('');
        setModuleModalOpen(true);
    };
    const openModuleEdit = (m: Module) => {
        setModuleEditing(m);
        setModuleName(m.name);
        setModuleDescription(m.description ?? '');
        setModuleModalOpen(true);
    };
    const submitModule = () => {
        if (!moduleName.trim()) return;
        const nextOrder = (data?.modules.length ?? 0) + 1;
        if (moduleEditing) {
            updateModule.mutate(
                {
                    id: moduleEditing.id,
                    data: { name: moduleName.trim(), description: moduleDescription.trim() || null },
                },
                { onSuccess: () => setModuleModalOpen(false) },
            );
        } else {
            createModule.mutate(
                {
                    sinf_id: sinfId,
                    name: moduleName.trim(),
                    description: moduleDescription.trim() || null,
                    order_index: nextOrder,
                },
                { onSuccess: () => setModuleModalOpen(false) },
            );
        }
    };

    const openTopicCreate = (moduleId: number) => {
        setTopicEditing(null);
        setTopicTargetModuleId(moduleId);
        setTopicName('');
        setTopicDescription('');
        setTopicHours('');
        setTopicOutcomes('');
        setTopicModalOpen(true);
    };
    const openTopicEdit = (t: Topic) => {
        setTopicEditing(t);
        setTopicTargetModuleId(t.module_id);
        setTopicName(t.name);
        setTopicDescription(t.description ?? '');
        setTopicHours(t.hours != null ? t.hours.toString() : '');
        setTopicOutcomes(t.learning_outcomes ?? '');
        setTopicModalOpen(true);
    };
    const submitTopic = () => {
        if (!topicName.trim() || topicTargetModuleId == null) return;
        const hoursNum = topicHours ? parseInt(topicHours, 10) : null;
        if (topicEditing) {
            updateTopic.mutate(
                {
                    id: topicEditing.id,
                    data: {
                        name: topicName.trim(),
                        description: topicDescription.trim() || null,
                        hours: hoursNum,
                        learning_outcomes: topicOutcomes.trim() || null,
                    },
                },
                { onSuccess: () => setTopicModalOpen(false) },
            );
        } else {
            const targetModule = data?.modules.find((m) => m.id === topicTargetModuleId);
            const nextOrder = (targetModule?.topics.length ?? 0) + 1;
            createTopic.mutate(
                {
                    module_id: topicTargetModuleId,
                    name: topicName.trim(),
                    description: topicDescription.trim() || null,
                    hours: hoursNum,
                    learning_outcomes: topicOutcomes.trim() || null,
                    order_index: nextOrder,
                },
                { onSuccess: () => setTopicModalOpen(false) },
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {canManage && (
                <div className="flex justify-end">
                    <Button onClick={openModuleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi modul
                    </Button>
                </div>
            )}

            {!data || data.modules.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Modullar yo'q. {canManage && 'Birinchi modulni qo\'shing.'}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {data.modules.map((m) => {
                        const isOpen = expanded.has(m.id);
                        return (
                            <Card key={m.id}>
                                <CardContent className="py-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggle(m.id)}
                                            className="rounded p-1 text-muted-foreground hover:bg-accent"
                                        >
                                            {isOpen ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{m.name}</p>
                                            {m.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                    {m.description}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {m.topics.length} mavzu
                                        </span>
                                        {canManage && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openTopicCreate(m.id)}
                                                    className="rounded p-1 text-primary hover:bg-primary/10"
                                                    title="Mavzu qo'shish"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openModuleEdit(m)}
                                                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModuleTarget(m)}
                                                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {isOpen && (
                                        <div className="pl-6 space-y-1">
                                            {m.topics.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">
                                                    Mavzular yo'q
                                                </p>
                                            ) : (
                                                m.topics.map((t) => (
                                                    <div
                                                        key={t.id}
                                                        className="flex items-center gap-2 rounded border border-border px-2 py-1.5"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{t.name}</p>
                                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                                {t.hours != null && <span>{t.hours} soat</span>}
                                                                {t.description && (
                                                                    <span className="truncate">{t.description}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {canManage && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => openTopicEdit(t)}
                                                                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteTopicTarget(t)}
                                                                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={moduleModalOpen}
                onClose={() => setModuleModalOpen(false)}
                title={moduleEditing ? 'Modulni tahrirlash' : 'Yangi modul'}
            >
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium block mb-1">Nomi</label>
                        <Input value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Tavsif</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={moduleDescription}
                            onChange={(e) => setModuleDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setModuleModalOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={submitModule}>{moduleEditing ? 'Saqlash' : "Qo'shish"}</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={topicModalOpen}
                onClose={() => setTopicModalOpen(false)}
                title={topicEditing ? 'Mavzuni tahrirlash' : 'Yangi mavzu'}
            >
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium block mb-1">Nomi</label>
                        <Input value={topicName} onChange={(e) => setTopicName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Tavsif</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={topicDescription}
                            onChange={(e) => setTopicDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Soatlar</label>
                        <Input
                            type="number"
                            min={0}
                            value={topicHours}
                            onChange={(e) => setTopicHours(e.target.value)}
                            placeholder="Masalan: 4"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">O'rganish natijalari</label>
                        <textarea
                            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={topicOutcomes}
                            onChange={(e) => setTopicOutcomes(e.target.value)}
                            placeholder="Talaba nimani biladi/qila oladi..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setTopicModalOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={submitTopic}>{topicEditing ? 'Saqlash' : "Qo'shish"}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteModuleTarget}
                onClose={() => setDeleteModuleTarget(null)}
                onConfirm={() => {
                    if (deleteModuleTarget) {
                        deleteModule.mutate(deleteModuleTarget.id, {
                            onSuccess: () => setDeleteModuleTarget(null),
                        });
                    }
                }}
                title="Modulni o'chirish"
                description={`"${deleteModuleTarget?.name}" modulini va uning barcha mavzularini o'chirmoqchimisiz?`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />

            <ConfirmDialog
                isOpen={!!deleteTopicTarget}
                onClose={() => setDeleteTopicTarget(null)}
                onConfirm={() => {
                    if (deleteTopicTarget) {
                        deleteTopic.mutate(deleteTopicTarget.id, {
                            onSuccess: () => setDeleteTopicTarget(null),
                        });
                    }
                }}
                title="Mavzuni o'chirish"
                description={`"${deleteTopicTarget?.name}" mavzusini o'chirmoqchimisiz?`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function LessonsTab({
    sinfId,
    sinfGroupOptions,
    canManage,
    sinfGroupIds,
}: {
    sinfId: number;
    sinfGroupOptions: { value: string; label: string }[];
    canManage: boolean;
    sinfGroupIds: Set<number>;
}) {
    const { data, isLoading, isError } = useLessons({ sinf_id: sinfId, page: 1, limit: 100 });
    const { data: structureData } = useModules(sinfId);

    const topicOptions = useMemo(() => {
        const opts: { value: string; label: string }[] = [{ value: '', label: '—' }];
        for (const m of structureData?.modules ?? []) {
            for (const t of m.topics) {
                opts.push({ value: t.id.toString(), label: `${m.name} → ${t.name}` });
            }
        }
        return opts;
    }, [structureData]);
    const createLesson = useCreateLesson();
    const updateLesson = useUpdateLesson();
    const deleteLesson = useDeleteLesson();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Lesson | null>(null);
    const [formGroupId, setFormGroupId] = useState('');
    const [formTopicId, setFormTopicId] = useState('');
    const [formLessonType, setFormLessonType] = useState<string>('');
    const [formTopic, setFormTopic] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormGroupId('');
        setFormTopicId('');
        setFormLessonType('lecture');
        setFormTopic('');
        setFormDate(new Date().toISOString().slice(0, 10));
        setFormDescription('');
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (lesson: Lesson) => {
        setEditing(lesson);
        setFormGroupId(lesson.group_id.toString());
        setFormTopicId(lesson.topic_id != null ? lesson.topic_id.toString() : '');
        setFormLessonType(lesson.lesson_type ?? '');
        setFormTopic(lesson.topic);
        setFormDate(lesson.date);
        setFormDescription(lesson.description ?? '');
        setFormError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const handleSubmit = () => {
        if (!formGroupId) {
            setFormError('Guruh tanlanmagan');
            return;
        }
        if (!formTopic.trim()) {
            setFormError('Mavzu bo\'sh bo\'lmasligi kerak');
            return;
        }
        if (!formDate) {
            setFormError('Sana tanlanmagan');
            return;
        }
        const groupIdNum = parseInt(formGroupId, 10);
        if (!sinfGroupIds.has(groupIdNum)) {
            setFormError('Guruh sinfga tegishli emas');
            return;
        }

        const lessonTypeValue = (formLessonType as LessonType) || null;
        const topicIdValue = formTopicId ? parseInt(formTopicId, 10) : null;

        if (editing) {
            const payload: LessonUpdateRequest = {
                group_id: groupIdNum,
                topic_id: topicIdValue,
                lesson_type: lessonTypeValue,
                topic: formTopic.trim(),
                date: formDate,
                description: formDescription.trim() || null,
            };
            updateLesson.mutate(
                { id: editing.id, data: payload },
                { onSuccess: closeModal, onError: () => setFormError('Xatolik yuz berdi') },
            );
        } else {
            const payload: LessonCreateRequest = {
                sinf_id: sinfId,
                group_id: groupIdNum,
                topic_id: topicIdValue,
                lesson_type: lessonTypeValue,
                topic: formTopic.trim(),
                date: formDate,
                description: formDescription.trim() || null,
            };
            createLesson.mutate(payload, {
                onSuccess: closeModal,
                onError: () => setFormError('Xatolik yuz berdi'),
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteLesson.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    };

    const isPending = createLesson.isPending || updateLesson.isPending;

    return (
        <div className="space-y-3">
            {canManage && (
                <div className="flex justify-end">
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi dars
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : isError ? (
                <p className="py-6 text-center text-sm text-destructive">Yuklab bo'lmadi</p>
            ) : !data || data.lessons.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Darslar yo'q
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {data.lessons.map((lesson) => (
                        <Card key={lesson.id} className="hover:border-primary transition">
                            <CardContent className="py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium truncate">{lesson.topic}</p>
                                        {lesson.lesson_type && (
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] ${LESSON_TYPE_COLOR[lesson.lesson_type]}`}
                                            >
                                                {LESSON_TYPE_LABEL[lesson.lesson_type]}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {lesson.date}
                                        {lesson.group?.name && ` · ${lesson.group.name}`}
                                    </p>
                                    {lesson.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {lesson.description}
                                        </p>
                                    )}
                                </div>
                                {canManage && (
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => openEdit(lesson)}
                                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            title="Tahrirlash"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(lesson)}
                                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            title="O'chirish"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Darsni tahrirlash' : 'Yangi dars'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Guruh</label>
                        <Combobox
                            options={sinfGroupOptions}
                            value={formGroupId}
                            onChange={setFormGroupId}
                            placeholder="Guruh tanlang..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Dars turi</label>
                        <Combobox
                            options={[
                                { value: '', label: '—' },
                                { value: 'lecture', label: "Ma'ruza" },
                                { value: 'seminar', label: 'Seminar' },
                                { value: 'independent', label: "Mustaqil ta'lim" },
                                { value: 'lab', label: 'Laboratoriya' },
                            ]}
                            value={formLessonType}
                            onChange={setFormLessonType}
                            placeholder="Tur tanlang..."
                        />
                    </div>
                    {topicOptions.length > 1 && (
                        <div>
                            <label className="text-sm font-medium block mb-1">Mavzu (modul ichidan)</label>
                            <Combobox
                                options={topicOptions}
                                value={formTopicId}
                                onChange={setFormTopicId}
                                placeholder="Tanlang..."
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium block mb-1">Mavzu</label>
                        <Input
                            placeholder="Dars mavzusi"
                            value={formTopic}
                            onChange={(e) => setFormTopic(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Sana</label>
                        <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Tavsif (ixtiyoriy)</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
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
                title="Darsni o'chirish"
                description={`"${deleteTarget?.topic}" darsini o'chirmoqchimisiz?`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function ResourcesTab({
    sinfId,
    sinfGroupOptions,
    canManage,
    sinfGroupIds,
}: {
    sinfId: number;
    sinfGroupOptions: { value: string; label: string }[];
    canManage: boolean;
    sinfGroupIds: Set<number>;
}) {
    const { data, isLoading, isError } = useResources(1, 100, undefined, undefined, undefined, sinfId);
    const createResource = useCreateResource();
    const updateResource = useUpdateResource();
    const deleteResource = useDeleteResource();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ResourceResponse | null>(null);
    const [formGroupId, setFormGroupId] = useState('');
    const [formMainText, setFormMainText] = useState('');
    const [formLinks, setFormLinks] = useState<ResourceLink[]>([{ title: '', url: '' }]);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<ResourceResponse | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormGroupId('');
        setFormMainText('');
        setFormLinks([{ title: '', url: '' }]);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (res: ResourceResponse) => {
        setEditing(res);
        setFormGroupId(res.group_id != null ? res.group_id.toString() : '');
        setFormMainText(res.main_text);
        setFormLinks(res.links.length > 0 ? [...res.links] : [{ title: '', url: '' }]);
        setFormError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const handleSubmit = () => {
        if (!formMainText.trim()) {
            setFormError('Asosiy matn bo\'sh bo\'lmasligi kerak');
            return;
        }
        for (const l of formLinks) {
            if (l.title && l.url && !isValidUrl(l.url)) {
                setFormError(`Noto'g'ri URL: ${l.url}`);
                return;
            }
        }

        const cleanLinks = formLinks.filter((l) => l.title.trim() && l.url.trim());
        const groupIdNum = formGroupId ? parseInt(formGroupId, 10) : null;
        if (groupIdNum != null && !sinfGroupIds.has(groupIdNum)) {
            setFormError('Guruh sinfga tegishli emas');
            return;
        }

        if (editing) {
            const payload: ResourceUpdateRequest = {
                main_text: formMainText,
                links: cleanLinks,
                group_id: groupIdNum,
            };
            updateResource.mutate(
                { id: editing.id, data: payload },
                { onSuccess: closeModal, onError: () => setFormError('Xatolik yuz berdi') },
            );
        } else {
            const payload: ResourceCreateRequest = {
                sinf_id: sinfId,
                group_id: groupIdNum,
                main_text: formMainText,
                links: cleanLinks,
                files: [],
            };
            createResource.mutate(payload, {
                onSuccess: closeModal,
                onError: () => setFormError('Xatolik yuz berdi'),
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteResource.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    };

    const isPending = createResource.isPending || updateResource.isPending;

    return (
        <div className="space-y-3">
            {canManage && (
                <div className="flex justify-end">
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi resurs
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : isError ? (
                <p className="py-6 text-center text-sm text-destructive">Yuklab bo'lmadi</p>
            ) : !data || data.resources.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Resurslar yo'q
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                    {data.resources.map((res) => (
                        <Card key={res.id} className="flex flex-col">
                            <CardContent className="pt-4 flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                        {res.group?.name && (
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                                                {res.group.name}
                                            </span>
                                        )}
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => openEdit(res)}
                                                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(res)}
                                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap text-foreground">{res.main_text}</p>
                                {res.links.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                        {res.links.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent transition"
                                            >
                                                <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                                                <span className="truncate">{link.title || link.url}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Resursni tahrirlash' : 'Yangi resurs'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Guruh (ixtiyoriy)</label>
                        <Combobox
                            options={[{ value: '', label: 'Tanlanmagan' }, ...sinfGroupOptions]}
                            value={formGroupId}
                            onChange={setFormGroupId}
                            placeholder="Guruh tanlang..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Asosiy matn</label>
                        <textarea
                            value={formMainText}
                            onChange={(e) => setFormMainText(e.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Resurs haqida..."
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Link2 className="h-3.5 w-3.5" /> Havolalar
                            </label>
                            <button
                                onClick={() => setFormLinks((prev) => [...prev, { title: '', url: '' }])}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <Plus className="h-3.5 w-3.5" /> Havola qo'shish
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formLinks.map((link, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Sarlavha"
                                        value={link.title}
                                        onChange={(e) =>
                                            setFormLinks((prev) =>
                                                prev.map((l, i) => (i === idx ? { ...l, title: e.target.value } : l)),
                                            )
                                        }
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="URL"
                                        value={link.url}
                                        onChange={(e) =>
                                            setFormLinks((prev) =>
                                                prev.map((l, i) => (i === idx ? { ...l, url: e.target.value } : l)),
                                            )
                                        }
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() =>
                                            setFormLinks((prev) => prev.filter((_, i) => i !== idx))
                                        }
                                        className="text-destructive hover:text-destructive/80"
                                        title="O'chirish"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
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
                title="Resursni o'chirish"
                description="Ushbu resursni o'chirmoqchimisiz?"
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function SyllabusTab({ sinfId, canManage }: { sinfId: number; canManage: boolean }) {
    const { data: syllabus, isLoading } = useSyllabus(sinfId);
    const upsert = useUpsertSyllabus(sinfId);

    const [goals, setGoals] = useState('');
    const [outcomes, setOutcomes] = useState('');
    const [prerequisites, setPrerequisites] = useState('');
    const [methodical, setMethodical] = useState('');
    const [literature, setLiterature] = useState<LiteratureItem[]>([]);
    const [grading, setGrading] = useState<Array<{ name: string; percent: string }>>([]);
    const [competencies, setCompetencies] = useState<string[]>([]);
    const [competencyInput, setCompetencyInput] = useState('');
    const [error, setError] = useState('');
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        if (syllabus) {
            setGoals(syllabus.goals ?? '');
            setOutcomes(syllabus.learning_outcomes ?? '');
            setPrerequisites(syllabus.prerequisites ?? '');
            setMethodical(syllabus.methodical_recommendations ?? '');
            setLiterature(syllabus.literature ?? []);
            setGrading(
                Object.entries(syllabus.grading_scheme ?? {}).map(([name, percent]) => ({
                    name,
                    percent: percent.toString(),
                })),
            );
            setCompetencies(syllabus.competencies ?? []);
        }
    }, [syllabus]);

    const totalPercent = grading.reduce((s, g) => s + (parseInt(g.percent, 10) || 0), 0);

    const handleSave = () => {
        if (totalPercent !== 0 && totalPercent !== 100) {
            setError(`Baholash sxemasi 100% bo'lishi kerak, hozir ${totalPercent}%`);
            return;
        }
        const scheme: Record<string, number> = {};
        for (const g of grading) {
            if (g.name.trim() && g.percent) {
                scheme[g.name.trim()] = parseInt(g.percent, 10) || 0;
            }
        }
        upsert.mutate(
            {
                goals: goals.trim() || null,
                learning_outcomes: outcomes.trim() || null,
                prerequisites: prerequisites.trim() || null,
                methodical_recommendations: methodical.trim() || null,
                literature: literature.filter((l) => l.title.trim()),
                grading_scheme: scheme,
                competencies: competencies.filter((c) => c.trim()),
            },
            {
                onSuccess: () => {
                    setError('');
                    setSavedAt(new Date().toLocaleTimeString());
                },
                onError: () => setError('Saqlashda xatolik'),
            },
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Scroll className="h-4 w-4 text-primary" /> O'quv-uslubiy majmua (UMK)
                    </h3>

                    <div>
                        <label className="text-sm font-medium block mb-1">Maqsadlar</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            value={goals}
                            onChange={(e) => setGoals(e.target.value)}
                            disabled={!canManage}
                            placeholder="Kursning umumiy maqsadlari..."
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Kutilayotgan natijalar</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            value={outcomes}
                            onChange={(e) => setOutcomes(e.target.value)}
                            disabled={!canManage}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Prerekvizitlar</label>
                        <textarea
                            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            value={prerequisites}
                            onChange={(e) => setPrerequisites(e.target.value)}
                            disabled={!canManage}
                            placeholder="Kurs uchun zarur oldingi bilimlar..."
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Uslubiy tavsiyalar</label>
                        <textarea
                            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            value={methodical}
                            onChange={(e) => setMethodical(e.target.value)}
                            disabled={!canManage}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Baholash sxemasi (% jami 100)</h3>
                        <span className={`text-xs ${totalPercent === 100 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            Jami: {totalPercent}%
                        </span>
                    </div>
                    <div className="space-y-2">
                        {grading.map((g, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Nom (masalan: Joriy nazorat)"
                                    value={g.name}
                                    onChange={(e) =>
                                        setGrading((prev) =>
                                            prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)),
                                        )
                                    }
                                    className="flex-1"
                                    disabled={!canManage}
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="%"
                                    value={g.percent}
                                    onChange={(e) =>
                                        setGrading((prev) =>
                                            prev.map((p, i) => (i === idx ? { ...p, percent: e.target.value } : p)),
                                        )
                                    }
                                    className="w-24"
                                    disabled={!canManage}
                                />
                                {canManage && (
                                    <button
                                        onClick={() => setGrading((prev) => prev.filter((_, i) => i !== idx))}
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {canManage && (
                            <button
                                onClick={() => setGrading((prev) => [...prev, { name: '', percent: '' }])}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <Plus className="h-3.5 w-3.5" /> Qator qo'shish
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Adabiyotlar</h3>
                    <div className="space-y-2">
                        {literature.map((l, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Sarlavha"
                                    value={l.title}
                                    onChange={(e) =>
                                        setLiterature((prev) =>
                                            prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)),
                                        )
                                    }
                                    className="flex-1"
                                    disabled={!canManage}
                                />
                                <Input
                                    placeholder="Muallif"
                                    value={l.author ?? ''}
                                    onChange={(e) =>
                                        setLiterature((prev) =>
                                            prev.map((p, i) => (i === idx ? { ...p, author: e.target.value } : p)),
                                        )
                                    }
                                    className="flex-1"
                                    disabled={!canManage}
                                />
                                <Input
                                    type="number"
                                    placeholder="Yil"
                                    value={l.year ?? ''}
                                    onChange={(e) =>
                                        setLiterature((prev) =>
                                            prev.map((p, i) =>
                                                i === idx ? { ...p, year: e.target.value ? parseInt(e.target.value, 10) : null } : p,
                                            ),
                                        )
                                    }
                                    className="w-24"
                                    disabled={!canManage}
                                />
                                {canManage && (
                                    <button
                                        onClick={() => setLiterature((prev) => prev.filter((_, i) => i !== idx))}
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {canManage && (
                            <button
                                onClick={() =>
                                    setLiterature((prev) => [...prev, { title: '', author: '', year: null }])
                                }
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <Plus className="h-3.5 w-3.5" /> Adabiyot qo'shish
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Kompetensiyalar</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {competencies.map((c, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                            >
                                {c}
                                {canManage && (
                                    <button
                                        onClick={() => setCompetencies((prev) => prev.filter((_, i) => i !== idx))}
                                        className="hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                    {canManage && (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Yangi kompetensiya..."
                                value={competencyInput}
                                onChange={(e) => setCompetencyInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && competencyInput.trim()) {
                                        setCompetencies((prev) => [...prev, competencyInput.trim()]);
                                        setCompetencyInput('');
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (competencyInput.trim()) {
                                        setCompetencies((prev) => [...prev, competencyInput.trim()]);
                                        setCompetencyInput('');
                                    }
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {canManage && (
                <div className="flex items-center justify-end gap-3">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {savedAt && !error && (
                        <p className="text-sm text-emerald-600">Saqlandi: {savedAt}</p>
                    )}
                    <Button onClick={handleSave} disabled={upsert.isPending}>
                        {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Saqlash
                    </Button>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function AssignmentsTab({ sinfId, canManage }: { sinfId: number; canManage: boolean }) {
    const { user } = useAuth();
    const isStudent = user?.roles?.some((r) => r.name.toLowerCase() === 'student');
    const { data, isLoading } = useAssignments({ sinf_id: sinfId, page: 1, limit: 100 });
    const createMut = useCreateAssignment();
    const updateMut = useUpdateAssignment();
    const deleteMut = useDeleteAssignment();

    const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
    const [nowSnapshot] = useState(() => Date.now());
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Assignment | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [maxGrade, setMaxGrade] = useState('100');
    const [allowFile, setAllowFile] = useState(true);
    const [allowText, setAllowText] = useState(true);
    const [error, setError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);

    const openCreate = () => {
        setEditing(null);
        setTitle('');
        setDescription('');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        setDeadline(tomorrow.toISOString().slice(0, 16));
        setMaxGrade('100');
        setAllowFile(true);
        setAllowText(true);
        setError('');
        setModalOpen(true);
    };
    const openEdit = (a: Assignment) => {
        setEditing(a);
        setTitle(a.title);
        setDescription(a.description ?? '');
        setDeadline(a.deadline.slice(0, 16));
        setMaxGrade(a.max_grade.toString());
        setAllowFile(a.allow_file);
        setAllowText(a.allow_text);
        setError('');
        setModalOpen(true);
    };
    const submit = () => {
        if (!title.trim() || !deadline) {
            setError("Sarlavha va muddat to'ldirilishi kerak");
            return;
        }
        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            deadline: new Date(deadline).toISOString(),
            max_grade: parseInt(maxGrade, 10) || 100,
            allow_file: allowFile,
            allow_text: allowText,
            allowed_file_types: [],
        };
        if (editing) {
            updateMut.mutate(
                { id: editing.id, data: payload },
                { onSuccess: () => setModalOpen(false), onError: () => setError('Xatolik') },
            );
        } else {
            createMut.mutate(
                { ...payload, sinf_id: sinfId },
                { onSuccess: () => setModalOpen(false), onError: () => setError('Xatolik') },
            );
        }
    };

    if (activeAssignment) {
        return (
            <AssignmentDetail
                assignment={activeAssignment}
                onBack={() => setActiveAssignment(null)}
                canManage={canManage}
                isStudent={!!isStudent}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {canManage && (
                <div className="flex justify-end">
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Yangi topshiriq
                    </Button>
                </div>
            )}

            {!data || data.assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        Topshiriqlar yo'q
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {data.assignments.map((a) => {
                        const dlDate = new Date(a.deadline);
                        const overdue = dlDate.getTime() < nowSnapshot;
                        const stats = a.stats;
                        return (
                            <Card
                                key={a.id}
                                className="hover:border-primary transition cursor-pointer"
                                onClick={() => setActiveAssignment(a)}
                            >
                                <CardContent className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{a.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <Clock className="h-3 w-3" />
                                            <span className={overdue ? 'text-destructive' : ''}>
                                                {dlDate.toLocaleString()}
                                            </span>
                                            <span>· max {a.max_grade}</span>
                                            {stats && (
                                                <span>
                                                    · {stats.submitted}/{stats.total_students} topshirgan
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(a);
                                                }}
                                                className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(a);
                                                }}
                                                className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq'}
            >
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium block mb-1">Sarlavha</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Tavsif</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Muddat (deadline)</label>
                        <Input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Maksimal ball</label>
                        <Input
                            type="number"
                            min={1}
                            max={1000}
                            value={maxGrade}
                            onChange={(e) => setMaxGrade(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={allowText}
                                onChange={(e) => setAllowText(e.target.checked)}
                                className="accent-primary"
                            />
                            Matn javob
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={allowFile}
                                onChange={(e) => setAllowFile(e.target.checked)}
                                className="accent-primary"
                            />
                            Fayl
                        </label>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={submit}>{editing ? 'Saqlash' : "Qo'shish"}</Button>
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
                title="Topshiriqni o'chirish"
                description={`"${deleteTarget?.title}" topshirig'ini va barcha javoblarini o'chirmoqchimisiz?`}
                confirmText="O'chirish"
                cancelText="Bekor qilish"
            />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
function AssignmentDetail({
    assignment,
    onBack,
    canManage,
    isStudent,
}: {
    assignment: Assignment;
    onBack: () => void;
    canManage: boolean;
    isStudent: boolean;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="rounded p-2 text-muted-foreground hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-semibold">{assignment.title}</h2>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Muddat: {new Date(assignment.deadline).toLocaleString()}</span>
                        <span>· Maks ball: {assignment.max_grade}</span>
                    </div>
                    {assignment.description && (
                        <p className="text-sm text-foreground whitespace-pre-wrap pt-2">
                            {assignment.description}
                        </p>
                    )}
                </CardContent>
            </Card>

            {isStudent ? (
                <StudentSubmissionForm assignment={assignment} />
            ) : canManage ? (
                <TeacherSubmissionsList assignment={assignment} />
            ) : null}
        </div>
    );
}

function StudentSubmissionForm({ assignment }: { assignment: Assignment }) {
    const { data: mySub, isLoading } = useMySubmission(assignment.id);
    const submitMut = useSubmitAssignment(assignment.id);
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (mySub) {
            setText(mySub.submitted_text ?? '');
        }
    }, [mySub]);

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const handleSubmit = () => {
        if (!text.trim()) {
            setError("Javob bo'sh bo'lmasligi kerak");
            return;
        }
        submitMut.mutate(
            { submitted_text: text.trim(), submitted_files: [] },
            { onSuccess: () => setError('') },
        );
    };

    const statusBadge = (status: string | undefined) => {
        if (!status) return null;
        const map: Record<string, { label: string; color: string }> = {
            submitted: { label: 'Topshirildi', color: 'bg-blue-500/10 text-blue-700' },
            late: { label: 'Kechikib topshirildi', color: 'bg-amber-500/10 text-amber-700' },
            graded: { label: 'Baholandi', color: 'bg-emerald-500/10 text-emerald-700' },
            returned: { label: 'Qaytarildi', color: 'bg-orange-500/10 text-orange-700' },
            draft: { label: 'Qoralama', color: 'bg-gray-500/10 text-gray-700' },
        };
        const cfg = map[status] ?? { label: status, color: 'bg-gray-500/10' };
        return (
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${cfg.color}`}>{cfg.label}</span>
        );
    };

    return (
        <Card>
            <CardContent className="pt-4 space-y-3">
                {mySub && (
                    <div className="flex items-center gap-2">
                        {statusBadge(mySub.status)}
                        {mySub.submitted_at && (
                            <span className="text-xs text-muted-foreground">
                                Topshirilgan: {new Date(mySub.submitted_at).toLocaleString()}
                            </span>
                        )}
                    </div>
                )}

                {mySub?.status === 'graded' && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Baho: {mySub.grade} / {assignment.max_grade}
                        </div>
                        {mySub.feedback && (
                            <p className="text-sm text-foreground whitespace-pre-wrap">{mySub.feedback}</p>
                        )}
                    </div>
                )}

                {assignment.allow_text && (
                    <div>
                        <label className="text-sm font-medium block mb-1">Javob matni</label>
                        <textarea
                            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={mySub?.status === 'graded'}
                            placeholder="Javobingizni yozing..."
                        />
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                {mySub?.status !== 'graded' && (
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={submitMut.isPending}>
                            {submitMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Send className="mr-2 h-4 w-4" />
                            {mySub ? 'Qayta topshirish' : 'Topshirish'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TeacherSubmissionsList({ assignment }: { assignment: Assignment }) {
    const { data, isLoading } = useSubmissions(assignment.id);
    const gradeMut = useGradeSubmission(assignment.id);

    const [gradingSub, setGradingSub] = useState<Submission | null>(null);
    const [gradeValue, setGradeValue] = useState('');
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    const openGrade = (sub: Submission) => {
        setGradingSub(sub);
        setGradeValue(sub.grade != null ? sub.grade.toString() : '');
        setFeedback(sub.feedback ?? '');
        setError('');
    };

    const submitGrade = () => {
        if (!gradingSub) return;
        const g = parseInt(gradeValue, 10);
        if (isNaN(g) || g < 0 || g > assignment.max_grade) {
            setError(`Baho 0 dan ${assignment.max_grade} gacha bo'lishi kerak`);
            return;
        }
        gradeMut.mutate(
            { userId: gradingSub.user_id, data: { grade: g, feedback: feedback.trim() || null } },
            { onSuccess: () => setGradingSub(null), onError: () => setError('Saqlashda xatolik') },
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-sm">Javoblar ({data?.submissions.length ?? 0})</h3>
                {!data || data.submissions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        Hali javoblar yo'q
                    </p>
                ) : (
                    <div className="space-y-1.5">
                        {data.submissions.map((sub) => (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {sub.user?.full_name ?? sub.user?.username ?? `User #${sub.user_id}`}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span>{sub.status}</span>
                                        {sub.submitted_at && (
                                            <span>· {new Date(sub.submitted_at).toLocaleString()}</span>
                                        )}
                                        {sub.grade != null && (
                                            <span className="text-emerald-700">
                                                · {sub.grade}/{assignment.max_grade}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => openGrade(sub)}>
                                    Baholash
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={!!gradingSub}
                    onClose={() => setGradingSub(null)}
                    title="Javobni baholash"
                >
                    {gradingSub && (
                        <div className="space-y-3">
                            <div className="text-sm">
                                <p className="font-medium">
                                    {gradingSub.user?.full_name ?? gradingSub.user?.username}
                                </p>
                                {gradingSub.submitted_text && (
                                    <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground mb-1">Javob matni:</p>
                                        <p className="whitespace-pre-wrap">{gradingSub.submitted_text}</p>
                                    </div>
                                )}
                                {gradingSub.submitted_files.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-muted-foreground">Fayllar:</p>
                                        {gradingSub.submitted_files.map((f, idx) => (
                                            <a
                                                key={idx}
                                                href={f.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                {f.name}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">
                                    Baho (0–{assignment.max_grade})
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={assignment.max_grade}
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Izoh / fidbek</label>
                                <textarea
                                    className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setGradingSub(null)}>
                                    Bekor qilish
                                </Button>
                                <Button onClick={submitGrade} disabled={gradeMut.isPending}>
                                    {gradeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Saqlash
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </CardContent>
        </Card>
    );
}
