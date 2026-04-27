import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { psychologyService, type QuestionCreateRequest, type QuestionType } from '@/services/psychologyService';

type RawRow = Record<string, unknown>;

interface ParsedRow {
    rowNumber: number; // 1-based, matches Excel row (header is row 1, data starts row 2)
    payload?: QuestionCreateRequest;
    error?: string;
}

const TYPE_SYNONYMS: Record<string, QuestionType> = {
    matnli: 'text',
    matn: 'text',
    text: 'text',
    ha_yoq: 'true_false',
    'ha-yoq': 'true_false',
    haqiqiy: 'true_false',
    true_false: 'true_false',
    shkala: 'scale',
    scale: 'scale',
};

// Column-name lookup: try Uzbek key first, fall back to legacy English.
function pick(row: RawRow, ...keys: string[]): unknown {
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    return undefined;
}

function asString(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v).trim();
}

function asNumber(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    return Number.isFinite(n) ? n : null;
}

interface BuildContext {
    methodId: number;
    rowNumber: number;
    order: number;
    category: string | null;
}

function buildPayload(row: RawRow, ctx: BuildContext): ParsedRow {
    const rawType = asString(pick(row, 'savol_turi', 'question_type')).toLowerCase();
    if (!rawType) return { rowNumber: ctx.rowNumber, error: "savol_turi bo'sh" };
    const type = TYPE_SYNONYMS[rawType];
    if (!type) {
        return { rowNumber: ctx.rowNumber, error: `savol_turi='${rawType}' qo'llab-quvvatlanmaydi (matnli / ha_yoq / shkala)` };
    }

    const text = asString(pick(row, 'matn', 'text'));
    if (!text) return { rowNumber: ctx.rowNumber, error: "matn ustuni bo'sh" };

    let content: Record<string, unknown> = {};
    let options: Array<Record<string, unknown>> | null = null;

    if (type === 'true_false') {
        content = { text };
    } else if (type === 'scale') {
        const min = asNumber(pick(row, 'shkala_min', 'scale_min'));
        const max = asNumber(pick(row, 'shkala_max', 'scale_max'));
        if (min === null || max === null) {
            return { rowNumber: ctx.rowNumber, error: 'shkala uchun shkala_min va shkala_max majburiy' };
        }
        if (min >= max) {
            return { rowNumber: ctx.rowNumber, error: 'shkala_min < shkala_max bo\'lishi kerak' };
        }
        content = { text, min, max };
        const minLabel = asString(pick(row, 'shkala_min_belgi', 'scale_min_label'));
        const maxLabel = asString(pick(row, 'shkala_max_belgi', 'scale_max_label'));
        if (minLabel) content.min_label = minLabel;
        if (maxLabel) content.max_label = maxLabel;
    } else if (type === 'text') {
        content = { text };
        const opts: Array<Record<string, unknown>> = [];
        for (let i = 1; i <= 10; i++) {
            const t = asString(pick(row, `variant_${i}_matn`, `option_${i}_text`));
            const v = asNumber(pick(row, `variant_${i}_qiymat`, `option_${i}_value`));
            if (!t && v === null) continue;
            if (!t) {
                return { rowNumber: ctx.rowNumber, error: `variant_${i}_matn bo'sh, lekin qiymat berilgan` };
            }
            opts.push({ text: t, value: v ?? 0 });
        }
        if (opts.length < 2) {
            return { rowNumber: ctx.rowNumber, error: 'matnli turi uchun kamida 2 ta variant kerak' };
        }
        options = opts;
    }

    return {
        rowNumber: ctx.rowNumber,
        payload: {
            method_id: ctx.methodId,
            question_type: type,
            content,
            options,
            order: ctx.order,
            category: ctx.category,
        },
    };
}

export function ExcelImportModal({
    open,
    onClose,
    methodId,
    category,
    nextOrder,
}: {
    open: boolean;
    onClose: () => void;
    methodId: number;
    /** Category these questions will be assigned to. Pass `null` for sum-mode or
     *  single-category methods where category doesn't apply. */
    category: string | null;
    /** First `order` value to use for the imported questions. The modal increments
     *  by 1 per row so each question gets a unique order within the method. */
    nextOrder: number;
}) {
    const qc = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fileName, setFileName] = useState<string>('');
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [parseError, setParseError] = useState<string>('');

    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState<{ done: number; failed: { row: number; reason: string }[] }>({ done: 0, failed: [] });
    const [finished, setFinished] = useState(false);

    const reset = () => {
        setFileName('');
        setRows([]);
        setParseError('');
        setProgress({ done: 0, failed: [] });
        setFinished(false);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (importing) return;
        reset();
        onClose();
    };

    const handleFile = async (file: File) => {
        reset();
        setFileName(file.name);
        try {
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const sheetName = wb.SheetNames.includes('Savollar') ? 'Savollar' : wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            if (!sheet) {
                setParseError("Excel ichida hech qanday list topilmadi.");
                return;
            }
            const raw = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
            const parsed = raw.map((r, i) => buildPayload(r, {
                methodId,
                rowNumber: i + 2,
                order: nextOrder + i,
                category,
            }));
            setRows(parsed);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setParseError(`Faylni o'qib bo'lmadi: ${msg}`);
        }
    };

    const validRows = useMemo(() => rows.filter(r => r.payload), [rows]);
    const invalidRows = useMemo(() => rows.filter(r => r.error), [rows]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { text: 0, true_false: 0, scale: 0 };
        for (const r of validRows) {
            if (r.payload) c[r.payload.question_type] = (c[r.payload.question_type] ?? 0) + 1;
        }
        return c;
    }, [validRows]);

    const handleImport = async () => {
        if (validRows.length === 0) return;
        setImporting(true);
        setProgress({ done: 0, failed: [] });

        for (const row of validRows) {
            if (!row.payload) continue;
            try {
                await psychologyService.createQuestion(row.payload);
                setProgress(p => ({ ...p, done: p.done + 1 }));
            } catch (err) {
                const reason = err instanceof Error ? err.message : String(err);
                setProgress(p => ({ ...p, failed: [...p.failed, { row: row.rowNumber, reason }] }));
            }
        }

        setImporting(false);
        setFinished(true);
        qc.invalidateQueries({ queryKey: ['psychology-methods'] });
        qc.invalidateQueries({ queryKey: ['psychology-method', methodId] });
    };

    return (
        <Modal isOpen={open} onClose={handleClose} title="Excel orqali savollar import qilish">
            <div className="flex flex-col gap-4">
                {category && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                        Barcha qatorlar <b className="text-primary">{category}</b> kategoriyasiga biriktiriladi.
                    </div>
                )}

                {!fileName && !parseError && (
                    <div className="flex flex-col gap-3">
                        <a
                            href="/templates/psychology-import-template.xlsx"
                            download
                            className="flex items-center gap-2 self-start text-xs font-medium text-primary hover:underline"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Shablon yuklab olish
                        </a>
                        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Excel faylni tanlang</span>
                            <span className="text-[11px] text-muted-foreground">.xlsx fayl, &quot;Savollar&quot; varagʻi shabloniga mos</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFile(f);
                                }}
                            />
                        </label>
                    </div>
                )}

                {parseError && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{parseError}</span>
                    </div>
                )}

                {fileName && !parseError && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                            <div className="flex items-center gap-2 truncate">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                                <span className="truncate font-medium text-foreground">{fileName}</span>
                            </div>
                            {!importing && !finished && (
                                <button onClick={reset} className="text-muted-foreground hover:text-destructive">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <SummaryCell label="Matnli" value={counts.text} />
                            <SummaryCell label="Ha / Yo'q" value={counts.true_false} />
                            <SummaryCell label="Shkala" value={counts.scale} />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Jami yaroqli: <b className="text-foreground">{validRows.length}</b></span>
                            {invalidRows.length > 0 && (
                                <span className="text-destructive">Xatolar: <b>{invalidRows.length}</b></span>
                            )}
                        </div>

                        {/* Errors list */}
                        {invalidRows.length > 0 && !finished && (
                            <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-destructive/5 p-2">
                                <ul className="space-y-1 text-[11px] text-destructive">
                                    {invalidRows.map(r => (
                                        <li key={r.rowNumber}>Qator {r.rowNumber}: {r.error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Progress */}
                        {(importing || finished) && (
                            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-foreground">
                                        {importing ? "Yuklanmoqda…" : 'Yuklash yakunlandi'}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {progress.done} / {validRows.length}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${validRows.length === 0 ? 0 : (progress.done / validRows.length) * 100}%` }}
                                    />
                                </div>
                                {progress.failed.length > 0 && (
                                    <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-[11px] text-destructive">
                                        {progress.failed.map(f => (
                                            <li key={f.row}>Qator {f.row}: {f.reason}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {finished && progress.failed.length === 0 && (
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Hammasi muvaffaqiyatli yuklandi.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 border-t border-border pt-3">
                    <Button variant="outline" onClick={handleClose} disabled={importing}>
                        {finished ? 'Yopish' : 'Bekor'}
                    </Button>
                    {!finished && (
                        <Button
                            onClick={handleImport}
                            disabled={importing || validRows.length === 0}
                        >
                            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yuklash ({validRows.length})
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col rounded-lg border border-border bg-muted/20 px-2.5 py-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className="text-base font-semibold text-foreground">{value}</span>
        </div>
    );
}
