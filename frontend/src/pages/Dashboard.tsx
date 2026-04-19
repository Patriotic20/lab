/**
 * Dashboard.tsx — Redesigned
 *
 * Design decisions:
 * - Clean welcome header: name + greeting, no gradient text, no logout button here
 *   (logout is in Navbar profile dropdown).
 * - StatCard: flat border card, no hover lift, compact icon pill.
 * - System status widget: simple two rows, green dot indicates live status.
 * - Bottom "academic" widget: centered, subtle gradient tint.
 */
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    BookOpen,
    GraduationCap,
    CheckCircle,
    FileQuestion,
    Book,
    UserCheck,
    Activity,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { teacherService } from '@/services/teacherService';
import { studentService } from '@/services/studentService';
import { subjectService } from '@/services/subjectService';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { resultService } from '@/services/resultService';

// --- Types ---

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    className?: string;
    description?: string;
    isLoading?: boolean;
    color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
}

const colorMap: Record<NonNullable<StatCardProps['color']>, string> = {
    blue:   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green:  'bg-green-500/10 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    pink:   'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    cyan:   'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

// --- StatCard ---

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    className,
    description,
    isLoading,
    color = 'blue',
}) => (
    <div className={cn('rounded-lg border bg-card p-5 shadow-sm', className)}>
        <div className="flex items-start justify-between">
            <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">{label}</p>
                {isLoading ? (
                    <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                )}
                {description && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {description}
                    </p>
                )}
            </div>
            <div className={cn('rounded-md p-2.5', colorMap[color])}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    </div>
);

// --- Dashboard ---

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    const { data: users,     isLoading: isUsersLoading }     = useQuery({ queryKey: ['dashboard-users'],     queryFn: () => userService.getUsers(1, 1) });
    const { data: teachers,  isLoading: isTeachersLoading }  = useQuery({ queryKey: ['dashboard-teachers'],  queryFn: () => teacherService.getTeachers(1, 1) });
    const { data: students,  isLoading: isStudentsLoading }  = useQuery({ queryKey: ['dashboard-students'],  queryFn: () => studentService.getStudents(1, 1) });
    const { data: subjects,  isLoading: isSubjectsLoading }  = useQuery({ queryKey: ['dashboard-subjects'],  queryFn: () => subjectService.getSubjects(1, 1) });
    const { data: quizzes,   isLoading: isQuizzesLoading }   = useQuery({ queryKey: ['dashboard-quizzes'],   queryFn: () => quizService.getQuizzes(1, 1) });
    const { data: questions, isLoading: isQuestionsLoading } = useQuery({ queryKey: ['dashboard-questions'], queryFn: () => questionService.getQuestions(1, 1) });
    const { data: results,   isLoading: isResultsLoading }   = useQuery({ queryKey: ['dashboard-results'],   queryFn: () => resultService.getResults(1, 1) });

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Xayrli tong';
        if (h < 18) return 'Xayrli kun';
        return 'Xayrli kech';
    };

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div>
                <h1 className="text-xl font-semibold">
                    {getGreeting()}, <span className="text-primary">{user?.username}</span> 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Universitet tizimidagi bugungi yangiliklar va ko'rsatkichlar.
                </p>
            </div>

            {/* Primary stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Foydalanuvchilar"  value={users?.total ?? 0}    icon={Users}        isLoading={isUsersLoading}    color="blue"   description="Tizimda faol" />
                <StatCard label="Talabalar"          value={students?.total ?? 0} icon={UserCheck}    isLoading={isStudentsLoading} color="purple" description="Faol o'qiyotganlar" />
                <StatCard label="O'qituvchilar"      value={teachers?.total ?? 0} icon={GraduationCap} isLoading={isTeachersLoading} color="cyan"  description="Barcha kafedralar" />
                <StatCard label="Faol testlar"       value={quizzes?.total ?? 0} icon={BookOpen}     isLoading={isQuizzesLoading}  color="pink"   description="Talabalar uchun ochiq" />
            </div>

            {/* Secondary stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Savollar banki"   value={questions?.total ?? 0} icon={FileQuestion} isLoading={isQuestionsLoading} color="orange" description="Jami savollar" />
                <StatCard label="Fanlar"            value={subjects?.total ?? 0}  icon={Book}         isLoading={isSubjectsLoading}  color="green"  description="Faol kurslar" />
                <StatCard label="Yakunlangan testlar" value={results?.total ?? 0} icon={CheckCircle}  isLoading={isResultsLoading}   color="blue"   description="Jami topshirilganlar" />
            </div>

            {/* System status + info */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Status */}
                <div className="rounded-lg border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold">Tizim holati</h2>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: "Ma'lumotlar bazasi", status: 'Barqaror' },
                            { label: 'API tarmoq shlyuzi', status: 'Ishlamoqda' },
                        ].map(({ label, status }) => (
                            <div key={label} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm">{label}</span>
                                </div>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">{status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info widget */}
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
                    <div className="mb-3 rounded-full bg-primary/10 p-3">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-sm font-semibold">Akademik mukammallik</h2>
                    <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                        Kengaytirilgan boshqaruv paneli orqali muassasangizning akademik resurslarini samarali boshqaring.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
