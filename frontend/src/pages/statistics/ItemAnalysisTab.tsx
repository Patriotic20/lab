import { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { CheckCircle2, AlertOctagon } from 'lucide-react';
import { StatChartCard } from '@/components/statistics/StatChartCard';
import { Combobox } from '@/components/ui/Combobox';
import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/services/quizService';
import {
    useQuestionDifficulty,
    useQuestionDiscrimination,
    useTopDistractors,
    useFlaggedQuestions,
} from '@/hooks/useStatistics';
import { colorAt } from '@/components/statistics/chartColors';

export const ItemAnalysisTab = () => {
    const [quizId, setQuizId] = useState<number | null>(null);
    const [questionId, setQuestionId] = useState<number | null>(null);

    const { data: quizzesData } = useQuery({
        queryKey: ['item-analysis-quizzes'],
        queryFn: () => quizService.getQuizzes(1, 500),
    });

    const quizOptions = useMemo(
        () =>
            quizzesData?.quizzes.map((q) => ({
                value: q.id.toString(),
                label: q.title,
            })) ?? [],
        [quizzesData]
    );

    const difficulty = useQuestionDifficulty(quizId);
    const discrimination = useQuestionDiscrimination(quizId);
    const flagged = useFlaggedQuestions(quizId);
    const distractors = useTopDistractors(questionId);

    const questionOptions = useMemo(
        () =>
            difficulty.data?.rows.map((r) => ({
                value: r.question_id.toString(),
                label:
                    r.text.length > 60 ? `${r.text.slice(0, 60)}…` : r.text,
            })) ?? [],
        [difficulty.data]
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
                <Combobox
                    options={quizOptions}
                    value={quizId?.toString() ?? ''}
                    onChange={(val) => {
                        setQuizId(val ? parseInt(val) : null);
                        setQuestionId(null);
                    }}
                    placeholder="Testni tanlang"
                    searchPlaceholder="Test qidirish..."
                    className="w-[280px]"
                />
            </div>

            {!quizId ? (
                <div className="rounded-lg border bg-card py-16 text-center text-sm text-muted-foreground shadow-sm">
                    Testni tanlang
                </div>
            ) : (
                <>
                    <StatChartCard
                        title="Savol murakkabligi"
                        description="Har bir savolga to'g'ri javob foizi"
                        isLoading={difficulty.isLoading}
                        isError={difficulty.isError}
                        isEmpty={!difficulty.isLoading && (difficulty.data?.rows?.length ?? 0) === 0}
                        height={360}
                    >
                        <ResponsiveContainer width="100%" height={340}>
                            <BarChart
                                data={difficulty.data?.rows ?? []}
                                margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="question_id" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ fontSize: 12 }}
                                    labelFormatter={(label, payload) =>
                                        payload?.[0]?.payload?.text ?? `ID ${label}`
                                    }
                                />
                                <Bar dataKey="correct_pct" fill={colorAt(2)} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </StatChartCard>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <StatChartCard
                            title="Diskriminatsiya indeksi"
                            description={`Tanlama hajmi: ${discrimination.data?.sample_size ?? 0}`}
                            isLoading={discrimination.isLoading}
                            isError={discrimination.isError}
                            isEmpty={
                                !discrimination.isLoading &&
                                (discrimination.data?.rows?.length ?? 0) === 0
                            }
                            height={360}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                                Savol
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                                Yuqori %
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                                Pastki %
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                                D
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(discrimination.data?.rows ?? []).map((r) => (
                                            <tr key={r.question_id} className="border-b last:border-0">
                                                <td className="px-3 py-2 truncate max-w-[220px]">
                                                    {r.text}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {r.top_correct_pct.toFixed(0)}%
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {r.bottom_correct_pct.toFixed(0)}%
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                    {r.discrimination_index.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </StatChartCard>

                        <StatChartCard
                            title="Belgilangan savollar"
                            description="Juda oson yoki juda qiyin"
                            isLoading={flagged.isLoading}
                            isError={flagged.isError}
                            isEmpty={!flagged.isLoading && (flagged.data?.rows?.length ?? 0) === 0}
                            height={360}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                                                Savol
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                                To'g'ri %
                                            </th>
                                            <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                                                Bayroq
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(flagged.data?.rows ?? []).map((r) => (
                                            <tr key={r.question_id} className="border-b last:border-0">
                                                <td className="px-3 py-2 truncate max-w-[220px]">
                                                    {r.text}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {r.correct_pct.toFixed(0)}%
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span
                                                        className={
                                                            r.flag === 'too_easy'
                                                                ? 'inline-flex items-center gap-1 text-xs text-green-600'
                                                                : 'inline-flex items-center gap-1 text-xs text-red-600'
                                                        }
                                                    >
                                                        {r.flag === 'too_easy' ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : (
                                                            <AlertOctagon className="h-3 w-3" />
                                                        )}
                                                        {r.flag === 'too_easy' ? 'oson' : 'qiyin'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </StatChartCard>
                    </div>

                    <StatChartCard
                        title="Top noto'g'ri javoblar"
                        description={
                            questionId
                                ? distractors.data?.correct_answer
                                    ? `To'g'ri: ${distractors.data.correct_answer}`
                                    : ''
                                : 'Savolni tanlang'
                        }
                        isLoading={distractors.isLoading}
                        isError={distractors.isError}
                        isEmpty={
                            !questionId ||
                            (!distractors.isLoading &&
                                (distractors.data?.rows?.length ?? 0) === 0)
                        }
                        emptyLabel={questionId ? "Ma'lumot topilmadi" : "Savolni tanlang"}
                        height={340}
                        actions={
                            <Combobox
                                options={questionOptions}
                                value={questionId?.toString() ?? ''}
                                onChange={(val) =>
                                    setQuestionId(val ? parseInt(val) : null)
                                }
                                placeholder="Savolni tanlang"
                                searchPlaceholder="Savol qidirish..."
                                className="w-[260px]"
                            />
                        }
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={distractors.data?.rows ?? []}
                                layout="vertical"
                                margin={{ top: 10, right: 16, left: 50, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="answer" type="category" tick={{ fontSize: 11 }} width={140} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                <Bar dataKey="count" fill={colorAt(6)} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </StatChartCard>
                </>
            )}
        </div>
    );
};

export default ItemAnalysisTab;
