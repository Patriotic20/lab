import { useState } from 'react';
import { useMyResults, useMethods } from '@/hooks/usePsychology';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, Brain, ClipboardList, Eye, Calendar, User as UserIcon } from 'lucide-react';
import type { TestResultResponse } from '@/services/psychologyService';
import { DiagnosisCard } from '@/components/psychology/DiagnosisCard';
import { AnswerRow } from '@/components/psychology/AnswerRow';

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('uz-UZ', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

function ResultDetailModal({ result, onClose }: { result: TestResultResponse | null; onClose: () => void }) {
    if (!result) return null;
    const questions = result.method?.questions ?? [];
    const questionsById = new Map(questions.map(q => [q.id, q]));

    return (
        <Modal isOpen={!!result} onClose={onClose} title={`Natija #${result.id}`}>
            <div className="flex flex-col gap-4">
                {/* Meta */}
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Metod</p>
                            <p className="font-medium text-foreground">{result.method?.name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Foydalanuvchi</p>
                            <p className="font-medium text-foreground">{result.user?.username ?? '—'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vaqt</p>
                            <p className="font-medium text-foreground">{formatDate(result.created_at)}</p>
                        </div>
                    </div>
                </div>

                {/* Diagnosis */}
                <DiagnosisCard diagnosis={result.diagnosis} />

                {/* Answers */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Javoblar ({result.answers.length})
                    </p>
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                        {result.answers.map((a, i) => (
                            <AnswerRow
                                key={i}
                                index={i}
                                question={questionsById.get(a.question_id)}
                                value={a.value}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>Yopish</Button>
                </div>
            </div>
        </Modal>
    );
}

export default function PsychologyResultsPage() {
    const [page, setPage] = useState(1);
    const [methodFilter, setMethodFilter] = useState<number | undefined>(undefined);
    const [selected, setSelected] = useState<TestResultResponse | null>(null);

    const { data: methodsData } = useMethods(1, 100);
    const { data, isLoading, isError } = useMyResults({ method_id: methodFilter, page });

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Psixologik test natijalari</h1>
                        <p className="text-xs text-muted-foreground">Barcha foydalanuvchilarning topshirgan testlari</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <Card className="mb-4">
                <CardContent className="flex items-center gap-3 py-3">
                    <label className="text-xs font-medium text-muted-foreground">Metod bo'yicha filter:</label>
                    <select
                        value={methodFilter ?? ''}
                        onChange={e => { setMethodFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">Barchasi</option>
                        {methodsData?.methods.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardHeader className="pb-0">
                    <p className="text-sm text-muted-foreground">
                        Jami: <span className="font-medium text-foreground">{data?.total ?? 0}</span> ta natija
                    </p>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <p className="py-8 text-center text-sm text-destructive">Xatolik yuz berdi</p>
                    ) : !data?.results.length ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <Brain className="h-10 w-10 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Hozircha natijalar yo'q</p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 flex flex-col gap-2">
                                {data.results.map(r => (
                                    <div
                                        key={r.id}
                                        className="flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/30"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <Brain className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{r.method?.name ?? 'Metod o\'chirilgan'}</p>
                                            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <UserIcon className="h-3 w-3" />
                                                    {r.user?.username ?? '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(r.created_at)}
                                                </span>
                                                <span>{r.answers.length} javob</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelected(r)}
                                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <Eye className="h-3.5 w-3.5" /> Ko'rish
                                        </button>
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

            <ResultDetailModal result={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
