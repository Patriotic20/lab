import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ScatterChart,
    Scatter,
    ZAxis,
} from 'recharts';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { StatsFiltersBar } from '@/components/statistics/StatsFiltersBar';
import {
    useYakuniyDistribution,
    useYakuniyBySubject,
    useYakuniyVsQuiz,
} from '@/hooks/useStatistics';
import type { StatsFilters } from '@/services/statisticsService';
import { colorAt } from '@/components/statistics/chartColors';

export const YakuniyTab = () => {
    const [filters, setFilters] = useState<StatsFilters>({});
    const distribution = useYakuniyDistribution(filters);
    const bySubject = useYakuniyBySubject(filters);
    const vsQuiz = useYakuniyVsQuiz(filters);

    return (
        <div className="space-y-4">
            <StatsFiltersBar value={filters} onChange={setFilters} />

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Yakuniy taqsimoti"
                    description={`Jami: ${distribution.data?.total ?? 0}`}
                    isLoading={distribution.isLoading}
                    isError={distribution.isError}
                    isEmpty={!distribution.isLoading && (distribution.data?.buckets?.length ?? 0) === 0}
                    height={300}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={distribution.data?.buckets ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="count" fill={colorAt(0)} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>

                <StatChartCard
                    title="Test va yakuniy korrelyatsiyasi"
                    description={
                        vsQuiz.data?.pearson_r != null
                            ? `r = ${vsQuiz.data.pearson_r.toFixed(3)}, n = ${vsQuiz.data.sample_size}`
                            : `n = ${vsQuiz.data?.sample_size ?? 0}`
                    }
                    isLoading={vsQuiz.isLoading}
                    isError={vsQuiz.isError}
                    isEmpty={!vsQuiz.isLoading && (vsQuiz.data?.points?.length ?? 0) === 0}
                    height={300}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                type="number"
                                dataKey="quiz_avg"
                                name="O'rt. test"
                                tick={{ fontSize: 11 }}
                                domain={[0, 100]}
                            />
                            <YAxis
                                type="number"
                                dataKey="yakuniy_grade"
                                name="Yakuniy"
                                tick={{ fontSize: 11 }}
                                domain={[0, 100]}
                            />
                            <ZAxis range={[40, 40]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ fontSize: 12 }}
                            />
                            <Scatter data={vsQuiz.data?.points ?? []} fill={colorAt(0)} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </StatChartCard>
            </div>

            <StatChartCard
                title="Fan bo'yicha yakuniy"
                description="Har bir fanning o'rtacha yakuniy bahosi"
                isLoading={bySubject.isLoading}
                isError={bySubject.isError}
                isEmpty={!bySubject.isLoading && (bySubject.data?.rows?.length ?? 0) === 0}
                height={360}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/30">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                    Fan
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                    Yozuvlar
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                    O'rt. baho
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(bySubject.data?.rows ?? []).map((r) => (
                                <tr key={r.subject_id} className="border-b last:border-0">
                                    <td className="px-3 py-2">{r.name}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.count}</td>
                                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                                        {r.average_grade.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </StatChartCard>
        </div>
    );
};

export default YakuniyTab;
