import { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Users, Brain, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { StatsFiltersBar } from '@/components/statistics/StatsFiltersBar';
import { Combobox } from '@/components/ui/Combobox';
import { psychologyService } from '@/services/psychologyService';
import {
    usePsychologyCoverage,
    usePsychologyPopularity,
    useDiagnosisDistribution,
    usePsychologyVsAcademic,
    usePsychologyRiskGroup,
} from '@/hooks/useStatistics';
import type { StatsFilters } from '@/services/statisticsService';
import { colorAt } from '@/components/statistics/chartColors';

export const PsychologyStatsTab = () => {
    const [filters, setFilters] = useState<StatsFilters>({});
    const [methodId, setMethodId] = useState<number | null>(null);

    const { data: methodsData } = useQuery({
        queryKey: ['psychology-methods-options'],
        queryFn: () => psychologyService.listMethods(1, 200),
    });

    const methodOptions = useMemo(
        () =>
            methodsData?.methods.map((m) => ({
                value: m.id.toString(),
                label: m.name,
            })) ?? [],
        [methodsData]
    );

    const coverage = usePsychologyCoverage(filters);
    const popularity = usePsychologyPopularity(filters);
    const diagnosis = useDiagnosisDistribution(methodId, filters);
    const vsAcademic = usePsychologyVsAcademic(methodId, filters);
    const risk = usePsychologyRiskGroup(methodId);

    return (
        <div className="space-y-4">
            <StatsFiltersBar
                value={filters}
                onChange={setFilters}
                extra={
                    <Combobox
                        options={methodOptions}
                        value={methodId?.toString() ?? ''}
                        onChange={(val) => setMethodId(val ? parseInt(val) : null)}
                        placeholder="Metodikani tanlang"
                        searchPlaceholder="Metodika qidirish..."
                        className="w-[240px]"
                    />
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Jami talabalar"
                    value={coverage.data?.total_students ?? 0}
                    icon={Users}
                    isLoading={coverage.isLoading}
                    color="blue"
                />
                <StatCard
                    label="Metodikalar"
                    value={popularity.data?.rows?.length ?? 0}
                    icon={Brain}
                    isLoading={popularity.isLoading}
                    color="purple"
                />
                <StatCard
                    label="Jami urinishlar"
                    value={
                        popularity.data?.rows?.reduce((s, r) => s + r.attempts, 0) ?? 0
                    }
                    icon={Activity}
                    isLoading={popularity.isLoading}
                    color="green"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Qamrov"
                    description="Har bir metodikadan o'tgan talabalar foizi"
                    isLoading={coverage.isLoading}
                    isError={coverage.isError}
                    isEmpty={!coverage.isLoading && (coverage.data?.rows?.length ?? 0) === 0}
                    height={320}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={coverage.data?.rows ?? []}
                            layout="vertical"
                            margin={{ top: 10, right: 16, left: 50, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="coverage_pct" fill={colorAt(1)} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>

                <StatChartCard
                    title="Mashhurligi"
                    description="Urinishlar soni bo'yicha metodikalar"
                    isLoading={popularity.isLoading}
                    isError={popularity.isError}
                    isEmpty={!popularity.isLoading && (popularity.data?.rows?.length ?? 0) === 0}
                    height={320}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={popularity.data?.rows ?? []}
                            layout="vertical"
                            margin={{ top: 10, right: 16, left: 50, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="attempts" fill={colorAt(0)} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Tashxis taqsimoti"
                    description={
                        methodId
                            ? `Jami: ${diagnosis.data?.total ?? 0}`
                            : "Metodikani tanlang"
                    }
                    isLoading={diagnosis.isLoading}
                    isError={diagnosis.isError}
                    isEmpty={
                        !methodId ||
                        (!diagnosis.isLoading && (diagnosis.data?.rows?.length ?? 0) === 0)
                    }
                    emptyLabel={methodId ? "Ma'lumot topilmadi" : "Metodikani tanlang"}
                    height={320}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={diagnosis.data?.rows ?? []}
                                dataKey="count"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius={95}
                                label
                            >
                                {(diagnosis.data?.rows ?? []).map((_, i) => (
                                    <Cell key={i} fill={colorAt(i)} />
                                ))}
                            </Pie>
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </StatChartCard>

                <StatChartCard
                    title="Akademik baho bilan korrelyatsiya"
                    description={methodId ? '' : 'Metodikani tanlang'}
                    isLoading={vsAcademic.isLoading}
                    isError={vsAcademic.isError}
                    isEmpty={
                        !methodId ||
                        (!vsAcademic.isLoading && (vsAcademic.data?.rows?.length ?? 0) === 0)
                    }
                    emptyLabel={methodId ? "Ma'lumot topilmadi" : "Metodikani tanlang"}
                    height={320}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={vsAcademic.data?.rows ?? []}
                            margin={{ top: 10, right: 16, left: 0, bottom: 30 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10 }}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar
                                dataKey="student_count"
                                name="Talabalar"
                                fill={colorAt(4)}
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="average_quiz_grade"
                                name="O'rt. baho"
                                fill={colorAt(2)}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>
            </div>

            <StatChartCard
                title="Xavf guruhi"
                description={methodId ? 'Salbiy tashxisli talabalar' : 'Metodikani tanlang'}
                isLoading={risk.isLoading}
                isError={risk.isError}
                isEmpty={
                    !methodId || (!risk.isLoading && (risk.data?.rows?.length ?? 0) === 0)
                }
                emptyLabel={methodId ? "Ma'lumot topilmadi" : "Metodikani tanlang"}
                height={300}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/30">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                    Talaba
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                    Tashxis
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(risk.data?.rows ?? []).map((r) => (
                                <tr key={r.user_id} className="border-b last:border-0">
                                    <td className="px-3 py-2">{r.full_name ?? '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </StatChartCard>
        </div>
    );
};

export default PsychologyStatsTab;
