import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { Trophy, Users, Activity, Target, Crown, Medal } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { Button } from '@/components/ui/Button';
import { useGeneralStats, useOrgLeaderboard } from '@/hooks/useStatistics';
import { colorAt } from '@/components/statistics/chartColors';

type Level = 'faculty' | 'group' | 'subject' | 'teacher';

const LEVELS: { value: Level; label: string }[] = [
    { value: 'faculty', label: 'Fakultet' },
    { value: 'group', label: 'Guruh' },
    { value: 'subject', label: 'Fan' },
    { value: 'teacher', label: "O'qituvchi" },
];

const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>;
};

export const GeneralTab = () => {
    const [level, setLevel] = useState<Level>('faculty');
    const { data: general, isLoading: generalLoading } = useGeneralStats();
    const { data: leaderboard, isLoading: lbLoading, isError: lbError } = useOrgLeaderboard({
        level,
        limit: 10,
    });

    const chartData = leaderboard?.rows?.map((r, i) => ({
        name: r.name.length > 18 ? `${r.name.slice(0, 18)}…` : r.name,
        fullName: r.name,
        average_grade: Math.round(r.average_grade * 100) / 100,
        attempts: r.attempts,
        idx: i,
    })) ?? [];

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Test topshirgan talabalar"
                    value={general?.total_students_tested ?? 0}
                    icon={Users}
                    isLoading={generalLoading}
                    color="blue"
                />
                <StatCard
                    label="Jami test urinishlari"
                    value={general?.total_quizzes_taken ?? 0}
                    icon={Activity}
                    isLoading={generalLoading}
                    color="purple"
                />
                <StatCard
                    label="Tizim o'rtacha bahosi"
                    value={general ? general.system_average_grade.toFixed(2) : '0'}
                    icon={Target}
                    isLoading={generalLoading}
                    color="green"
                />
            </div>

            <StatChartCard
                title="Top 10 reyting"
                description={`${LEVELS.find((l) => l.value === level)?.label} bo'yicha o'rtacha baho`}
                isLoading={lbLoading}
                isError={lbError}
                isEmpty={!lbLoading && !lbError && chartData.length === 0}
                height={360}
                actions={
                    <div className="flex flex-wrap gap-1">
                        {LEVELS.map((l) => (
                            <Button
                                key={l.value}
                                size="sm"
                                variant={level === l.value ? 'primary' : 'outline'}
                                onClick={() => setLevel(l.value)}
                            >
                                {l.label}
                            </Button>
                        ))}
                    </div>
                }
            >
                <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11 }}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={70}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                            contentStyle={{ fontSize: 12 }}
                            labelFormatter={(_label, payload) =>
                                payload?.[0]?.payload?.fullName ?? _label
                            }
                            formatter={(val) => (typeof val === 'number' ? val.toFixed(2) : String(val))}
                        />
                        <Bar dataKey="average_grade" fill={colorAt(0)} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </StatChartCard>

            <div className="rounded-lg border bg-card shadow-sm">
                <div className="flex items-center gap-2 border-b px-5 py-3">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-sm font-semibold">Reyting jadvali</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/30">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                    O'rin
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                    Nomi
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                    Urinishlar
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                    O'rtacha baho
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(leaderboard?.rows ?? []).map((row, i) => (
                                <tr key={`${row.scope_id}-${i}`} className="border-b last:border-0">
                                    <td className="px-4 py-2.5">
                                        <RankBadge rank={i + 1} />
                                    </td>
                                    <td className="px-4 py-2.5 font-medium">{row.name}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                        {row.attempts}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                        {row.average_grade.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {(leaderboard?.rows ?? []).length === 0 && !lbLoading && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                                    >
                                        Ma'lumot topilmadi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
