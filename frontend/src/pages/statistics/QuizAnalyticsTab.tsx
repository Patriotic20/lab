import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { StatsFiltersBar } from '@/components/statistics/StatsFiltersBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, XCircle, Activity, Percent } from 'lucide-react';
import {
    useGradeDistribution,
    usePassRate,
    useGradeTrend,
    useDifficultyRanking,
    useTimeStats,
} from '@/hooks/useStatistics';
import type { StatsFilters } from '@/services/statisticsService';
import { colorAt } from '@/components/statistics/chartColors';

type Granularity = 'day' | 'week' | 'month';

export const QuizAnalyticsTab = () => {
    const [filters, setFilters] = useState<StatsFilters>({});
    const [threshold, setThreshold] = useState(60);
    const [granularity, setGranularity] = useState<Granularity>('month');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    const distribution = useGradeDistribution(filters);
    const passRate = usePassRate({ ...filters, threshold });
    const trend = useGradeTrend({ ...filters, granularity });
    const difficulty = useDifficultyRanking({ ...filters, order, limit: 10 });
    const timeStats = useTimeStats(filters);

    const passData = passRate.data
        ? [
              { name: "O'tdi", value: passRate.data.passed },
              { name: "O'tmadi", value: passRate.data.failed },
          ]
        : [];

    return (
        <div className="space-y-4">
            <StatsFiltersBar value={filters} onChange={setFilters} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Jami urinishlar"
                    value={passRate.data?.total ?? 0}
                    icon={Activity}
                    isLoading={passRate.isLoading}
                    color="blue"
                />
                <StatCard
                    label="O'tdi"
                    value={passRate.data?.passed ?? 0}
                    icon={CheckCircle2}
                    isLoading={passRate.isLoading}
                    color="green"
                />
                <StatCard
                    label="O'tmadi"
                    value={passRate.data?.failed ?? 0}
                    icon={XCircle}
                    isLoading={passRate.isLoading}
                    color="red"
                />
                <StatCard
                    label="O'tish foizi"
                    value={passRate.data ? `${passRate.data.pass_rate_pct.toFixed(1)}%` : '0%'}
                    icon={Percent}
                    isLoading={passRate.isLoading}
                    color="purple"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Baholar taqsimoti"
                    description={`Jami: ${distribution.data?.total ?? 0}`}
                    isLoading={distribution.isLoading}
                    isError={distribution.isError}
                    isEmpty={(distribution.data?.buckets?.length ?? 0) === 0 && !distribution.isLoading}
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
                    title="O'tish koeffitsienti"
                    description={`Chegara: ${threshold}%`}
                    isLoading={passRate.isLoading}
                    isError={passRate.isError}
                    isEmpty={!passRate.data || passRate.data.total === 0}
                    height={300}
                    actions={
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Chegara:</span>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value || 0))}
                                className="h-8 w-20"
                            />
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={passData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={95}
                                paddingAngle={2}
                            >
                                {passData.map((_, i) => (
                                    <Cell key={i} fill={i === 0 ? colorAt(2) : colorAt(6)} />
                                ))}
                            </Pie>
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </StatChartCard>
            </div>

            <StatChartCard
                title="Baholar trendi"
                description="Vaqt davomida o'rtacha baho va urinishlar soni"
                isLoading={trend.isLoading}
                isError={trend.isError}
                isEmpty={(trend.data?.points?.length ?? 0) === 0 && !trend.isLoading}
                height={320}
                actions={
                    <div className="flex gap-1">
                        {(['day', 'week', 'month'] as Granularity[]).map((g) => (
                            <Button
                                key={g}
                                size="sm"
                                variant={granularity === g ? 'primary' : 'outline'}
                                onClick={() => setGranularity(g)}
                            >
                                {g === 'day' ? 'Kun' : g === 'week' ? 'Hafta' : 'Oy'}
                            </Button>
                        ))}
                    </div>
                }
            >
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trend.data?.points ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                            type="monotone"
                            dataKey="average_grade"
                            name="O'rtacha baho"
                            stroke={colorAt(0)}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="attempts"
                            name="Urinishlar"
                            stroke={colorAt(3)}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </StatChartCard>

            <div className="grid gap-4 lg:grid-cols-2">
                <StatChartCard
                    title="Testlar murakkabligi"
                    description="O'rtacha baho bo'yicha tartiblangan top 10"
                    isLoading={difficulty.isLoading}
                    isError={difficulty.isError}
                    isEmpty={(difficulty.data?.rows?.length ?? 0) === 0 && !difficulty.isLoading}
                    height={360}
                    actions={
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant={order === 'asc' ? 'primary' : 'outline'}
                                onClick={() => setOrder('asc')}
                            >
                                Qiyin
                            </Button>
                            <Button
                                size="sm"
                                variant={order === 'desc' ? 'primary' : 'outline'}
                                onClick={() => setOrder('desc')}
                            >
                                Oson
                            </Button>
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
                                        O'rt. baho
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(difficulty.data?.rows ?? []).map((r) => (
                                    <tr key={r.quiz_id} className="border-b last:border-0">
                                        <td className="px-3 py-2 truncate max-w-[260px]">{r.title}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{r.attempts}</td>
                                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                                            {r.average_grade.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </StatChartCard>

                <StatChartCard
                    title="Vaqt statistikasi"
                    description="Testlar davomiyligi va urinishlar"
                    isLoading={timeStats.isLoading}
                    isError={timeStats.isError}
                    isEmpty={(timeStats.data?.rows?.length ?? 0) === 0 && !timeStats.isLoading}
                    height={360}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                        Test
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                        Davomiyligi (daq)
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                        Urinish
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(timeStats.data?.rows ?? []).map((r) => (
                                    <tr key={r.quiz_id} className="border-b last:border-0">
                                        <td className="px-3 py-2 truncate max-w-[260px]">{r.title}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{r.duration_minutes}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{r.attempts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </StatChartCard>
            </div>
        </div>
    );
};

export default QuizAnalyticsTab;
