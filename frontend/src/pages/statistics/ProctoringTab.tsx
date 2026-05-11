import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
} from 'recharts';
import { ShieldAlert, AlertTriangle, Percent, Eye } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { StatsFiltersBar } from '@/components/statistics/StatsFiltersBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
    useCheatingOverview,
    useCheatingByReason,
    useCheatingByScope,
    useRepeatOffenders,
    useSuspectQuizzes,
    useProctoringEvidence,
} from '@/hooks/useStatistics';
import type { StatsFilters } from '@/services/statisticsService';
import { colorAt } from '@/components/statistics/chartColors';

type Scope = 'faculty' | 'group' | 'subject' | 'quiz';

const SCOPES: { value: Scope; label: string }[] = [
    { value: 'faculty', label: 'Fakultet' },
    { value: 'group', label: 'Guruh' },
    { value: 'subject', label: 'Fan' },
    { value: 'quiz', label: 'Test' },
];

export const ProctoringTab = () => {
    const [filters, setFilters] = useState<StatsFilters>({});
    const [scope, setScope] = useState<Scope>('faculty');
    const [minCount, setMinCount] = useState(2);
    const [thresholdPct, setThresholdPct] = useState(20);
    const [evidenceUserId, setEvidenceUserId] = useState<number | null>(null);
    const [evidenceUserName, setEvidenceUserName] = useState<string>('');

    const overview = useCheatingOverview(filters);
    const byReason = useCheatingByReason(filters);
    const byScope = useCheatingByScope(scope, filters);
    const repeat = useRepeatOffenders({ ...filters, min_count: minCount });
    const suspect = useSuspectQuizzes({ ...filters, threshold_pct: thresholdPct });
    const evidence = useProctoringEvidence(evidenceUserId);

    return (
        <div className="space-y-4">
            <StatsFiltersBar value={filters} onChange={setFilters} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Jami urinishlar"
                    value={overview.data?.total_attempts ?? 0}
                    icon={Eye}
                    isLoading={overview.isLoading}
                    color="blue"
                />
                <StatCard
                    label="Aldash urinishlari"
                    value={overview.data?.cheating_attempts ?? 0}
                    icon={ShieldAlert}
                    isLoading={overview.isLoading}
                    color="red"
                />
                <StatCard
                    label="Aldash darajasi"
                    value={
                        overview.data
                            ? `${overview.data.cheating_rate_pct.toFixed(1)}%`
                            : '0%'
                    }
                    icon={Percent}
                    isLoading={overview.isLoading}
                    color="orange"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Sabab bo'yicha"
                    description={`Jami: ${byReason.data?.total_cheating ?? 0}`}
                    isLoading={byReason.isLoading}
                    isError={byReason.isError}
                    isEmpty={(byReason.data?.rows?.length ?? 0) === 0 && !byReason.isLoading}
                    height={320}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={byReason.data?.rows ?? []}
                            layout="vertical"
                            margin={{ top: 10, right: 16, left: 50, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                dataKey="reason"
                                type="category"
                                tick={{ fontSize: 11 }}
                                width={140}
                            />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {(byReason.data?.rows ?? []).map((_, i) => (
                                    <Cell key={i} fill={colorAt(i)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>

                <StatChartCard
                    title="Bo'lim bo'yicha"
                    isLoading={byScope.isLoading}
                    isError={byScope.isError}
                    isEmpty={(byScope.data?.rows?.length ?? 0) === 0 && !byScope.isLoading}
                    height={320}
                    actions={
                        <div className="flex flex-wrap gap-1">
                            {SCOPES.map((s) => (
                                <Button
                                    key={s.value}
                                    size="sm"
                                    variant={scope === s.value ? 'primary' : 'outline'}
                                    onClick={() => setScope(s.value)}
                                >
                                    {s.label}
                                </Button>
                            ))}
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={byScope.data?.rows?.slice(0, 10) ?? []}
                            margin={{ top: 10, right: 16, left: 0, bottom: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                interval={0}
                                angle={-30}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="cheating_rate_pct" name="Aldash %" fill={colorAt(6)} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Takroriy aldovchilar"
                    description="Bir necha marta aldash qilgan talabalar"
                    isLoading={repeat.isLoading}
                    isError={repeat.isError}
                    isEmpty={(repeat.data?.rows?.length ?? 0) === 0 && !repeat.isLoading}
                    height={360}
                    actions={
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Min:</span>
                            <Input
                                type="number"
                                min={1}
                                value={minCount}
                                onChange={(e) => setMinCount(Number(e.target.value || 1))}
                                className="h-8 w-16"
                            />
                        </div>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                        Talaba
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                        Guruh
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                        Holatlar
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground" />
                                </tr>
                            </thead>
                            <tbody>
                                {(repeat.data?.rows ?? []).map((r) => (
                                    <tr key={r.user_id} className="border-b last:border-0">
                                        <td className="px-3 py-2">{r.full_name ?? '—'}</td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {r.group_name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-red-600">
                                            {r.cheating_count}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEvidenceUserId(r.user_id);
                                                    setEvidenceUserName(r.full_name ?? `ID ${r.user_id}`);
                                                }}
                                            >
                                                <Eye className="mr-1 h-3 w-3" />
                                                Dalil
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </StatChartCard>

                <StatChartCard
                    title="Shubhali testlar"
                    description="Yuqori aldash darajasidagi testlar"
                    isLoading={suspect.isLoading}
                    isError={suspect.isError}
                    isEmpty={(suspect.data?.rows?.length ?? 0) === 0 && !suspect.isLoading}
                    height={360}
                    actions={
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Chegara %:</span>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={thresholdPct}
                                onChange={(e) => setThresholdPct(Number(e.target.value || 0))}
                                className="h-8 w-16"
                            />
                        </div>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                        Test
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                        Urinish
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                        Aldash
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                        %
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(suspect.data?.rows ?? []).map((r) => (
                                    <tr key={r.quiz_id} className="border-b last:border-0">
                                        <td className="px-3 py-2 truncate max-w-[200px]">{r.title}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{r.attempts}</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-red-600">
                                            {r.cheating_attempts}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                            {r.cheating_rate_pct.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </StatChartCard>
            </div>

            <Modal
                isOpen={evidenceUserId != null}
                onClose={() => setEvidenceUserId(null)}
                title={`Dalillar: ${evidenceUserName}`}
                className="max-w-4xl"
            >
                {evidence.isLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Yuklanmoqda...
                    </div>
                ) : (evidence.data?.rows?.length ?? 0) === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        Hech qanday dalil topilmadi.
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {(evidence.data?.rows ?? []).map((row) => (
                            <div
                                key={row.result_id}
                                className="overflow-hidden rounded-lg border bg-card"
                            >
                                {row.cheating_image_url ? (
                                    <img
                                        src={row.cheating_image_url}
                                        alt="cheating evidence"
                                        className="h-40 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-40 items-center justify-center bg-muted text-xs text-muted-foreground">
                                        Rasm yo'q
                                    </div>
                                )}
                                <div className="space-y-1 p-3 text-xs">
                                    <div className="font-medium">
                                        {row.quiz_title ?? `Test ID ${row.quiz_id}`}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {row.reason_for_stop ?? "Sabab ko'rsatilmagan"}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {new Date(row.created_at).toLocaleString('uz-UZ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProctoringTab;
