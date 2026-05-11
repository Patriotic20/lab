import { useQuery } from '@tanstack/react-query';
import { statisticsService, type StatsFilters } from '@/services/statisticsService';

const stableKey = (obj: object): Record<string, unknown> => {
    const entries = Object.entries(obj as Record<string, unknown>);
    const sorted: Record<string, unknown> = {};
    entries
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') sorted[k] = v;
        });
    return sorted;
};

// ─── General ─────────────────────────────────────────────────────────────────

export const useGeneralStats = () =>
    useQuery({
        queryKey: ['stats', 'general'],
        queryFn: () => statisticsService.getGeneral(),
        placeholderData: (prev) => prev,
    });

// ─── Quiz analytics ──────────────────────────────────────────────────────────

export const useGradeDistribution = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'gradeDistribution', stableKey(filters)],
        queryFn: () => statisticsService.getGradeDistribution(filters),
        placeholderData: (prev) => prev,
    });

export const usePassRate = (filters: StatsFilters & { threshold?: number } = {}) =>
    useQuery({
        queryKey: ['stats', 'passRate', stableKey(filters)],
        queryFn: () => statisticsService.getPassRate(filters),
        placeholderData: (prev) => prev,
    });

export const useGradeTrend = (
    filters: StatsFilters & { granularity?: 'day' | 'week' | 'month' } = {}
) =>
    useQuery({
        queryKey: ['stats', 'gradeTrend', stableKey(filters)],
        queryFn: () => statisticsService.getGradeTrend(filters),
        placeholderData: (prev) => prev,
    });

export const useDifficultyRanking = (
    filters: StatsFilters & { order?: 'asc' | 'desc'; limit?: number } = {}
) =>
    useQuery({
        queryKey: ['stats', 'difficultyRanking', stableKey(filters)],
        queryFn: () => statisticsService.getDifficultyRanking(filters),
        placeholderData: (prev) => prev,
    });

export const useTimeStats = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'timeStats', stableKey(filters)],
        queryFn: () => statisticsService.getTimeStats(filters),
        placeholderData: (prev) => prev,
    });

// ─── Item analysis ───────────────────────────────────────────────────────────

export const useQuestionDifficulty = (quiz_id: number | null) =>
    useQuery({
        queryKey: ['stats', 'questionDifficulty', quiz_id],
        queryFn: () => statisticsService.getQuestionDifficulty(quiz_id!),
        enabled: !!quiz_id,
        placeholderData: (prev) => prev,
    });

export const useQuestionDiscrimination = (quiz_id: number | null) =>
    useQuery({
        queryKey: ['stats', 'questionDiscrimination', quiz_id],
        queryFn: () => statisticsService.getQuestionDiscrimination(quiz_id!),
        enabled: !!quiz_id,
        placeholderData: (prev) => prev,
    });

export const useTopDistractors = (question_id: number | null, limit = 5) =>
    useQuery({
        queryKey: ['stats', 'topDistractors', question_id, limit],
        queryFn: () => statisticsService.getTopDistractors(question_id!, limit),
        enabled: !!question_id,
        placeholderData: (prev) => prev,
    });

export const useFlaggedQuestions = (quiz_id: number | null) =>
    useQuery({
        queryKey: ['stats', 'flaggedQuestions', quiz_id],
        queryFn: () => statisticsService.getFlaggedQuestions(quiz_id!),
        enabled: !!quiz_id,
        placeholderData: (prev) => prev,
    });

// ─── Proctoring ──────────────────────────────────────────────────────────────

export const useCheatingOverview = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'cheatingOverview', stableKey(filters)],
        queryFn: () => statisticsService.getCheatingOverview(filters),
        placeholderData: (prev) => prev,
    });

export const useCheatingByReason = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'cheatingByReason', stableKey(filters)],
        queryFn: () => statisticsService.getCheatingByReason(filters),
        placeholderData: (prev) => prev,
    });

export const useCheatingByScope = (
    scope: 'faculty' | 'group' | 'subject' | 'quiz',
    filters: StatsFilters = {}
) =>
    useQuery({
        queryKey: ['stats', 'cheatingByScope', scope, stableKey(filters)],
        queryFn: () => statisticsService.getCheatingByScope(scope, filters),
        placeholderData: (prev) => prev,
    });

export const useRepeatOffenders = (filters: StatsFilters & { min_count?: number } = {}) =>
    useQuery({
        queryKey: ['stats', 'repeatOffenders', stableKey(filters)],
        queryFn: () => statisticsService.getRepeatOffenders(filters),
        placeholderData: (prev) => prev,
    });

export const useSuspectQuizzes = (filters: StatsFilters & { threshold_pct?: number } = {}) =>
    useQuery({
        queryKey: ['stats', 'suspectQuizzes', stableKey(filters)],
        queryFn: () => statisticsService.getSuspectQuizzes(filters),
        placeholderData: (prev) => prev,
    });

export const useProctoringEvidence = (user_id: number | null) =>
    useQuery({
        queryKey: ['stats', 'proctoringEvidence', user_id],
        queryFn: () => statisticsService.getProctoringEvidence(user_id!),
        enabled: !!user_id,
    });

// ─── Organizational ──────────────────────────────────────────────────────────

export const useOrgLeaderboard = (
    params: StatsFilters & { level: 'faculty' | 'group' | 'subject' | 'teacher'; limit?: number }
) =>
    useQuery({
        queryKey: ['stats', 'orgLeaderboard', stableKey(params)],
        queryFn: () => statisticsService.getOrgLeaderboard(params),
        placeholderData: (prev) => prev,
    });

// ─── Demographics ────────────────────────────────────────────────────────────

export const useDemographics = (
    dimension: 'gender' | 'education-form' | 'education-type' | 'education-lang' | 'payment-form',
    filters: StatsFilters = {}
) =>
    useQuery({
        queryKey: ['stats', 'demographics', dimension, stableKey(filters)],
        queryFn: () => statisticsService.getDemographicsBy(dimension, filters),
        placeholderData: (prev) => prev,
    });

export const useGpaCorrelation = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'gpaCorrelation', stableKey(filters)],
        queryFn: () => statisticsService.getGpaCorrelation(filters),
        placeholderData: (prev) => prev,
    });

export const useSemesterProgression = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'semesterProgression', stableKey(filters)],
        queryFn: () => statisticsService.getSemesterProgression(filters),
        placeholderData: (prev) => prev,
    });

// ─── Yakuniy ─────────────────────────────────────────────────────────────────

export const useYakuniyDistribution = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'yakuniyDistribution', stableKey(filters)],
        queryFn: () => statisticsService.getYakuniyDistribution(filters),
        placeholderData: (prev) => prev,
    });

export const useYakuniyBySubject = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'yakuniyBySubject', stableKey(filters)],
        queryFn: () => statisticsService.getYakuniyBySubject(filters),
        placeholderData: (prev) => prev,
    });

export const useYakuniyVsQuiz = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'yakuniyVsQuiz', stableKey(filters)],
        queryFn: () => statisticsService.getYakuniyVsQuiz(filters),
        placeholderData: (prev) => prev,
    });

// ─── Psychology ──────────────────────────────────────────────────────────────

export const usePsychologyCoverage = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'psychologyCoverage', stableKey(filters)],
        queryFn: () => statisticsService.getPsychologyCoverage(filters),
        placeholderData: (prev) => prev,
    });

export const usePsychologyPopularity = (filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'psychologyPopularity', stableKey(filters)],
        queryFn: () => statisticsService.getPsychologyPopularity(filters),
        placeholderData: (prev) => prev,
    });

export const useDiagnosisDistribution = (method_id: number | null, filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'diagnosisDistribution', method_id, stableKey(filters)],
        queryFn: () => statisticsService.getDiagnosisDistribution(method_id!, filters),
        enabled: !!method_id,
        placeholderData: (prev) => prev,
    });

export const usePsychologyVsAcademic = (method_id: number | null, filters: StatsFilters = {}) =>
    useQuery({
        queryKey: ['stats', 'psychologyVsAcademic', method_id, stableKey(filters)],
        queryFn: () => statisticsService.getPsychologyVsAcademic(method_id!, filters),
        enabled: !!method_id,
        placeholderData: (prev) => prev,
    });

export const usePsychologyRiskGroup = (method_id: number | null, label_substring?: string) =>
    useQuery({
        queryKey: ['stats', 'psychologyRiskGroup', method_id, label_substring ?? ''],
        queryFn: () => statisticsService.getPsychologyRiskGroup(method_id!, label_substring),
        enabled: !!method_id,
        placeholderData: (prev) => prev,
    });

// ─── Teacher activity ────────────────────────────────────────────────────────

export const useTeacherQuestionQuality = (teacher_id: number | null) =>
    useQuery({
        queryKey: ['stats', 'teacherQuestionQuality', teacher_id],
        queryFn: () => statisticsService.getTeacherQuestionQuality(teacher_id!),
        enabled: !!teacher_id,
        placeholderData: (prev) => prev,
    });

export const useTeacherActivityTimeline = (
    teacher_id: number | null,
    granularity: 'day' | 'week' | 'month' = 'month'
) =>
    useQuery({
        queryKey: ['stats', 'teacherActivity', teacher_id, granularity],
        queryFn: () => statisticsService.getTeacherActivity(teacher_id!, granularity),
        enabled: !!teacher_id,
        placeholderData: (prev) => prev,
    });

export const useTeacherProctoring = (teacher_id: number | null) =>
    useQuery({
        queryKey: ['stats', 'teacherProctoring', teacher_id],
        queryFn: () => statisticsService.getTeacherProctoring(teacher_id!),
        enabled: !!teacher_id,
        placeholderData: (prev) => prev,
    });
