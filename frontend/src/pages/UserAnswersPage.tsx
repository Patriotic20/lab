import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUserAnswers } from '@/hooks/useUserAnswers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

const optionLabels: Record<string, string> = {
    a: 'A',
    b: 'B',
    c: 'C',
    d: 'D',
};

const UserAnswersPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const userId = searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined;
    const quizId = searchParams.get('quiz_id') ? Number(searchParams.get('quiz_id')) : undefined;

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const { data, isLoading } = useUserAnswers({
        page: currentPage,
        limit: pageSize,
        user_id: userId,
        quiz_id: quizId,
    });

    const answers = data?.answers || [];
    const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

    const stripHtml = (html: string) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Orqaga
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Javoblar tafsiloti</h1>
                    <p className="text-sm text-muted-foreground">
                        Jami: {data?.total || 0} ta savol
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : answers.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p>Javoblar topilmadi.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {answers.map((answer, index) => {
                        const question = answer.question;
                        const questionNumber = (currentPage - 1) * pageSize + index + 1;

                        return (
                            <Card
                                key={answer.id}
                                className={`border-l-4 ${answer.is_correct
                                    ? 'border-l-green-400 dark:border-l-green-600/50'
                                    : 'border-l-red-400 dark:border-l-red-600/50'
                                    }`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base font-medium">
                                            <span className="text-muted-foreground mr-2">#{questionNumber}</span>
                                            {question ? stripHtml(question.text) : `Savol #${answer.question_id}`}
                                        </CardTitle>
                                        {answer.is_correct ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                        )}
                                    </div>
                                </CardHeader>
                                {question && (
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                                                const optionKey = `option_${opt}` as keyof typeof question;
                                                const optionText = question[optionKey] as string;
                                                const isSelected = answer.answer === optionText || answer.answer?.toLowerCase() === opt;
                                                const isCorrectOption = answer.correct_answer === optionText || question.option_a === optionText;

                                                let optionStyles = 'bg-transparent border-border text-foreground opacity-80';
                                                if (isCorrectOption) {
                                                    optionStyles = 'bg-transparent border-green-500/50 text-green-600 dark:border-green-500/40 dark:text-green-400 font-semibold opacity-100 shadow-sm';
                                                } else if (isSelected) {
                                                    optionStyles = 'bg-transparent border-red-500/50 text-red-600 dark:border-red-500/40 dark:text-red-400 font-medium opacity-100 shadow-sm';
                                                }

                                                return (
                                                    <div
                                                        key={opt}
                                                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${optionStyles}`}
                                                    >
                                                        <span className="font-semibold mr-2">{optionLabels[opt]})</span>
                                                        {optionText}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Tanlangan javob: <span className="font-medium">
                                                {answer.answer ? (['a', 'b', 'c', 'd'].includes(answer.answer.toLowerCase()) ? optionLabels[answer.answer.toLowerCase()] : answer.answer) : '-'}
                                            </span>
                                            {' · '}
                                            {answer.is_correct ? (
                                                <span className="text-green-600 font-medium">To'g'ri</span>
                                            ) : (
                                                <span className="text-red-600 font-medium">Noto'g'ri</span>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
            />
        </div>
    );
};

export default UserAnswersPage;
