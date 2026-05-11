import { useMemo, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    LineChart,
    BarChart3,
    ShieldAlert,
    Users,
    Brain,
    GraduationCap,
    UserCog,
    FileSearch,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const GeneralTab = lazy(() => import('@/pages/statistics/GeneralTab'));
const QuizAnalyticsTab = lazy(() => import('@/pages/statistics/QuizAnalyticsTab'));
const ProctoringTab = lazy(() => import('@/pages/statistics/ProctoringTab'));
const DemographicsTab = lazy(() => import('@/pages/statistics/DemographicsTab'));
const PsychologyStatsTab = lazy(() => import('@/pages/statistics/PsychologyStatsTab'));
const YakuniyTab = lazy(() => import('@/pages/statistics/YakuniyTab'));
const TeacherActivityTab = lazy(() => import('@/pages/statistics/TeacherActivityTab'));
const ItemAnalysisTab = lazy(() => import('@/pages/statistics/ItemAnalysisTab'));

type TabKey =
    | 'general'
    | 'quiz'
    | 'proctoring'
    | 'demographics'
    | 'psychology'
    | 'yakuniy'
    | 'teacher'
    | 'items';

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ElementType;
    permission?: string;
}

const TABS: TabDef[] = [
    { key: 'general',      label: 'Umumiy',                 icon: LineChart },
    { key: 'quiz',         label: 'Test analitikasi',       icon: BarChart3 },
    { key: 'proctoring',   label: 'Proktoring',             icon: ShieldAlert, permission: 'read:statistics:proctoring' },
    { key: 'demographics', label: 'Demografiya',            icon: Users,       permission: 'read:statistics:demographics' },
    { key: 'psychology',   label: 'Psixologiya',            icon: Brain,       permission: 'read:statistics:psychology' },
    { key: 'yakuniy',      label: 'Yakuniy',                icon: GraduationCap },
    { key: 'teacher',      label: "O'qituvchi faoliyati",   icon: UserCog },
    { key: 'items',        label: 'Savol analizi',          icon: FileSearch,  permission: 'read:statistics:items' },
];

const Fallback = () => (
    <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
);

const StatisticsPage = () => {
    const [params, setParams] = useSearchParams();
    const { hasPermission } = useAuth();

    const availableTabs = useMemo(
        () => TABS.filter((t) => !t.permission || hasPermission(t.permission)),
        [hasPermission]
    );

    const requested = params.get('tab') as TabKey | null;
    const active: TabKey =
        requested && availableTabs.some((t) => t.key === requested)
            ? requested
            : availableTabs[0]?.key ?? 'general';

    const setTab = (key: TabKey) => {
        const next = new URLSearchParams(params);
        next.set('tab', key);
        setParams(next, { replace: true });
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                    <LineChart className="h-5 w-5 text-primary" />
                    Statistika
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Tizim bo'yicha barcha ko'rsatkichlar va analitik panellar
                </p>
            </div>

            <div className="flex flex-wrap gap-2 border-b pb-2">
                {availableTabs.map(({ key, label, icon: Icon }) => (
                    <Button
                        key={key}
                        size="sm"
                        variant={active === key ? 'primary' : 'outline'}
                        onClick={() => setTab(key)}
                    >
                        <Icon className="mr-1.5 h-3.5 w-3.5" />
                        {label}
                    </Button>
                ))}
            </div>

            <Suspense fallback={<Fallback />}>
                {active === 'general'      && <GeneralTab />}
                {active === 'quiz'         && <QuizAnalyticsTab />}
                {active === 'proctoring'   && <ProctoringTab />}
                {active === 'demographics' && <DemographicsTab />}
                {active === 'psychology'   && <PsychologyStatsTab />}
                {active === 'yakuniy'      && <YakuniyTab />}
                {active === 'teacher'      && <TeacherActivityTab />}
                {active === 'items'        && <ItemAnalysisTab />}
            </Suspense>
        </div>
    );
};

export default StatisticsPage;
