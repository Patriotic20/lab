import { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
    Legend,
    Cell,
} from 'recharts';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { StatsFiltersBar } from '@/components/statistics/StatsFiltersBar';
import {
    useDemographics,
    useGpaCorrelation,
    useSemesterProgression,
} from '@/hooks/useStatistics';
import type { StatsFilters } from '@/services/statisticsService';
import { colorAt } from '@/components/statistics/chartColors';

type Dim = 'gender' | 'education-form' | 'education-type' | 'education-lang' | 'payment-form';

const DIM_LABELS: Record<Dim, string> = {
    gender: 'Jinsi',
    'education-form': "Ta'lim shakli",
    'education-type': "Ta'lim turi",
    'education-lang': "Ta'lim tili",
    'payment-form': "To'lov shakli",
};

const DemographicChart = ({ dimension, filters }: { dimension: Dim; filters: StatsFilters }) => {
    const { data, isLoading, isError } = useDemographics(dimension, filters);
    const rows = data?.rows ?? [];

    return (
        <StatChartCard
            title={DIM_LABELS[dimension]}
            description="Urinishlar va o'rtacha baho"
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && rows.length === 0}
            height={300}
        >
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                        dataKey="category"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={50}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="attempts" name="Urinish" fill={colorAt(0)} radius={[4, 4, 0, 0]} />
                    <Bar
                        dataKey="average_grade"
                        name="O'rt. baho"
                        fill={colorAt(2)}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </StatChartCard>
    );
};

export const DemographicsTab = () => {
    const [filters, setFilters] = useState<StatsFilters>({});
    const gpa = useGpaCorrelation(filters);
    const semester = useSemesterProgression(filters);

    return (
        <div className="space-y-4">
            <StatsFiltersBar value={filters} onChange={setFilters} />

            <div className="grid gap-4 lg:grid-cols-2">
                <DemographicChart dimension="gender" filters={filters} />
                <DemographicChart dimension="education-form" filters={filters} />
                <DemographicChart dimension="education-type" filters={filters} />
                <DemographicChart dimension="education-lang" filters={filters} />
                <DemographicChart dimension="payment-form" filters={filters} />

                <StatChartCard
                    title="GPA korrelyatsiyasi"
                    description="GPA va o'rtacha test bahosi"
                    isLoading={gpa.isLoading}
                    isError={gpa.isError}
                    isEmpty={!gpa.isLoading && (gpa.data?.rows?.length ?? 0) === 0}
                    height={300}
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={gpa.data?.rows ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="gpa_bucket" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="student_count" name="Talabalar" fill={colorAt(5)} radius={[4, 4, 0, 0]}>
                                {(gpa.data?.rows ?? []).map((_, i) => (
                                    <Cell key={i} fill={colorAt(i)} />
                                ))}
                            </Bar>
                            <Bar
                                dataKey="average_grade"
                                name="O'rt. baho"
                                fill={colorAt(2)}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </StatChartCard>
            </div>

            <StatChartCard
                title="Semestrlar bo'yicha rivojlanish"
                description="Vaqt bo'yicha urinishlar va baholar"
                isLoading={semester.isLoading}
                isError={semester.isError}
                isEmpty={!semester.isLoading && (semester.data?.rows?.length ?? 0) === 0}
                height={320}
            >
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={semester.data?.rows ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
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
        </div>
    );
};

export default DemographicsTab;
