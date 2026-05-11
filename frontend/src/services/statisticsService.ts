import api from './api';

// ─── Shared filter shape ─────────────────────────────────────────────────────

export interface StatsFilters {
    date_from?: string; // YYYY-MM-DD
    date_to?: string;
    faculty_id?: number;
    group_id?: number;
    subject_id?: number;
    kafedra_id?: number;
}

// ─── Response types ──────────────────────────────────────────────────────────

export interface GeneralStats {
    total_students_tested: number;
    total_quizzes_taken: number;
    system_average_grade: number;
}

export interface GradeBucket {
    bucket: string;
    count: number;
}

export interface GradeDistribution {
    total: number;
    buckets: GradeBucket[];
}

export interface PassRate {
    threshold: number;
    total: number;
    passed: number;
    failed: number;
    pass_rate_pct: number;
}

export interface GradeTrendPoint {
    period: string;
    attempts: number;
    average_grade: number;
}

export interface GradeTrend {
    granularity: string;
    points: GradeTrendPoint[];
}

export interface QuizDifficultyRow {
    quiz_id: number;
    title: string;
    attempts: number;
    average_grade: number;
}

export interface QuizDifficulty {
    order: string;
    rows: QuizDifficultyRow[];
}

export interface QuizTimeStatsRow {
    quiz_id: number;
    title: string;
    duration_minutes: number;
    attempts: number;
}

export interface QuizTimeStats {
    rows: QuizTimeStatsRow[];
}

export interface QuestionDifficultyRow {
    question_id: number;
    text: string;
    total_responses: number;
    correct_count: number;
    correct_pct: number;
}

export interface QuestionDifficulty {
    quiz_id: number;
    rows: QuestionDifficultyRow[];
}

export interface QuestionDiscriminationRow {
    question_id: number;
    text: string;
    top_correct_pct: number;
    bottom_correct_pct: number;
    discrimination_index: number;
}

export interface QuestionDiscrimination {
    quiz_id: number;
    sample_size: number;
    rows: QuestionDiscriminationRow[];
}

export interface DistractorRow {
    answer: string;
    count: number;
    pct: number;
}

export interface TopDistractors {
    question_id: number;
    correct_answer: string | null;
    rows: DistractorRow[];
}

export interface FlaggedQuestionRow {
    question_id: number;
    text: string;
    correct_pct: number;
    flag: 'too_easy' | 'too_hard';
}

export interface FlaggedQuestions {
    quiz_id: number;
    rows: FlaggedQuestionRow[];
}

export interface CheatingOverview {
    total_attempts: number;
    cheating_attempts: number;
    cheating_rate_pct: number;
}

export interface CheatingReasonRow {
    reason: string | null;
    count: number;
    pct: number;
}

export interface CheatingByReason {
    total_cheating: number;
    rows: CheatingReasonRow[];
}

export interface CheatingScopeRow {
    scope_id: number;
    name: string;
    total: number;
    cheating: number;
    cheating_rate_pct: number;
}

export interface CheatingByScope {
    scope: string;
    rows: CheatingScopeRow[];
}

export interface RepeatOffenderRow {
    user_id: number;
    full_name: string | null;
    group_name: string | null;
    cheating_count: number;
}

export interface RepeatOffenders {
    min_count: number;
    rows: RepeatOffenderRow[];
}

export interface SuspectQuizRow {
    quiz_id: number;
    title: string;
    attempts: number;
    cheating_attempts: number;
    cheating_rate_pct: number;
}

export interface SuspectQuizzes {
    threshold_pct: number;
    rows: SuspectQuizRow[];
}

export interface ProctoringEvidenceRow {
    result_id: number;
    quiz_id: number | null;
    quiz_title: string | null;
    cheating_image_url: string | null;
    reason_for_stop: string | null;
    created_at: string;
}

export interface ProctoringEvidence {
    user_id: number;
    rows: ProctoringEvidenceRow[];
}

export interface LeaderboardRow {
    scope_id: number;
    name: string;
    attempts: number;
    average_grade: number;
}

export interface Leaderboard {
    level: string;
    rows: LeaderboardRow[];
}

export interface DemographicRow {
    category: string;
    attempts: number;
    average_grade: number;
    pass_rate_pct: number;
}

export interface DemographicResponse {
    dimension: string;
    rows: DemographicRow[];
}

export interface GpaBucketRow {
    gpa_bucket: string;
    student_count: number;
    average_grade: number;
}

export interface GpaCorrelation {
    rows: GpaBucketRow[];
}

export interface SemesterRow {
    semester: string;
    attempts: number;
    average_grade: number;
}

export interface SemesterProgression {
    rows: SemesterRow[];
}

export interface YakuniyDistribution {
    total: number;
    buckets: GradeBucket[];
}

export interface YakuniySubjectRow {
    subject_id: number;
    name: string;
    count: number;
    average_grade: number;
}

export interface YakuniyBySubject {
    rows: YakuniySubjectRow[];
}

export interface YakuniyVsQuizPoint {
    user_id: number;
    subject_id: number;
    quiz_avg: number;
    yakuniy_grade: number;
}

export interface YakuniyVsQuiz {
    sample_size: number;
    pearson_r: number | null;
    points: YakuniyVsQuizPoint[];
}

export interface PsychologyMethodCoverageRow {
    method_id: number;
    name: string;
    completions: number;
    coverage_pct: number;
}

export interface PsychologyCoverage {
    total_students: number;
    rows: PsychologyMethodCoverageRow[];
}

export interface PsychologyMethodPopularityRow {
    method_id: number;
    name: string;
    attempts: number;
}

export interface PsychologyMethodPopularity {
    rows: PsychologyMethodPopularityRow[];
}

export interface DiagnosisRow {
    label: string;
    count: number;
    pct: number;
}

export interface DiagnosisDistribution {
    method_id: number;
    total: number;
    rows: DiagnosisRow[];
}

export interface PsychologyVsAcademicRow {
    label: string;
    student_count: number;
    average_quiz_grade: number;
}

export interface PsychologyVsAcademic {
    method_id: number;
    rows: PsychologyVsAcademicRow[];
}

export interface PsychologyRiskRow {
    user_id: number;
    full_name: string | null;
    label: string;
    diagnosis: Record<string, unknown> | unknown[] | null;
}

export interface PsychologyRiskGroup {
    method_id: number;
    rows: PsychologyRiskRow[];
}

export interface TeacherQuestionQuality {
    teacher_id: number;
    total_questions: number;
    average_correct_pct: number;
}

export interface TeacherActivityPoint {
    period: string;
    quizzes_created: number;
}

export interface TeacherActivity {
    teacher_id: number;
    granularity: string;
    points: TeacherActivityPoint[];
}

export interface TeacherProctoring {
    teacher_id: number;
    total_attempts: number;
    cheating_attempts: number;
    cheating_rate_pct: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cleanParams = (params: object): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') out[k] = v;
    }
    return out;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const statisticsService = {
    // General
    getGeneral: async (): Promise<GeneralStats> => {
        const { data } = await api.get<GeneralStats>('/statistics/general');
        return data;
    },

    // Quiz analytics
    getGradeDistribution: async (filters: StatsFilters = {}): Promise<GradeDistribution> => {
        const { data } = await api.get<GradeDistribution>('/statistics/quiz-analytics/grade-distribution', {
            params: cleanParams(filters),
        });
        return data;
    },
    getPassRate: async (filters: StatsFilters & { threshold?: number } = {}): Promise<PassRate> => {
        const { data } = await api.get<PassRate>('/statistics/quiz-analytics/pass-rate', {
            params: cleanParams(filters),
        });
        return data;
    },
    getGradeTrend: async (
        filters: StatsFilters & { granularity?: 'day' | 'week' | 'month' } = {}
    ): Promise<GradeTrend> => {
        const { data } = await api.get<GradeTrend>('/statistics/quiz-analytics/grade-trend', {
            params: cleanParams(filters),
        });
        return data;
    },
    getDifficultyRanking: async (
        filters: StatsFilters & { order?: 'asc' | 'desc'; limit?: number } = {}
    ): Promise<QuizDifficulty> => {
        const { data } = await api.get<QuizDifficulty>('/statistics/quiz-analytics/difficulty-ranking', {
            params: cleanParams(filters),
        });
        return data;
    },
    getTimeStats: async (filters: StatsFilters = {}): Promise<QuizTimeStats> => {
        const { data } = await api.get<QuizTimeStats>('/statistics/quiz-analytics/time-stats', {
            params: cleanParams(filters),
        });
        return data;
    },

    // Item analysis
    getQuestionDifficulty: async (quiz_id: number): Promise<QuestionDifficulty> => {
        const { data } = await api.get<QuestionDifficulty>(`/statistics/item-analysis/quiz/${quiz_id}/difficulty`);
        return data;
    },
    getQuestionDiscrimination: async (quiz_id: number): Promise<QuestionDiscrimination> => {
        const { data } = await api.get<QuestionDiscrimination>(
            `/statistics/item-analysis/quiz/${quiz_id}/discrimination`
        );
        return data;
    },
    getTopDistractors: async (question_id: number, limit = 5): Promise<TopDistractors> => {
        const { data } = await api.get<TopDistractors>(`/statistics/item-analysis/question/${question_id}/distractors`, {
            params: { limit },
        });
        return data;
    },
    getFlaggedQuestions: async (quiz_id: number): Promise<FlaggedQuestions> => {
        const { data } = await api.get<FlaggedQuestions>(`/statistics/item-analysis/quiz/${quiz_id}/flagged`);
        return data;
    },

    // Proctoring
    getCheatingOverview: async (filters: StatsFilters = {}): Promise<CheatingOverview> => {
        const { data } = await api.get<CheatingOverview>('/statistics/proctoring/overview', {
            params: cleanParams(filters),
        });
        return data;
    },
    getCheatingByReason: async (filters: StatsFilters = {}): Promise<CheatingByReason> => {
        const { data } = await api.get<CheatingByReason>('/statistics/proctoring/by-reason', {
            params: cleanParams(filters),
        });
        return data;
    },
    getCheatingByScope: async (
        scope: 'faculty' | 'group' | 'subject' | 'quiz',
        filters: StatsFilters = {}
    ): Promise<CheatingByScope> => {
        const { data } = await api.get<CheatingByScope>('/statistics/proctoring/by-scope', {
            params: cleanParams({ ...filters, scope }),
        });
        return data;
    },
    getRepeatOffenders: async (
        filters: StatsFilters & { min_count?: number } = {}
    ): Promise<RepeatOffenders> => {
        const { data } = await api.get<RepeatOffenders>('/statistics/proctoring/repeat-offenders', {
            params: cleanParams(filters),
        });
        return data;
    },
    getSuspectQuizzes: async (
        filters: StatsFilters & { threshold_pct?: number } = {}
    ): Promise<SuspectQuizzes> => {
        const { data } = await api.get<SuspectQuizzes>('/statistics/proctoring/suspect-quizzes', {
            params: cleanParams(filters),
        });
        return data;
    },
    getProctoringEvidence: async (user_id: number): Promise<ProctoringEvidence> => {
        const { data } = await api.get<ProctoringEvidence>(`/statistics/proctoring/evidence/${user_id}`);
        return data;
    },

    // Organizational
    getOrgLeaderboard: async (
        filters: StatsFilters & { level: 'faculty' | 'group' | 'subject' | 'teacher'; limit?: number }
    ): Promise<Leaderboard> => {
        const { data } = await api.get<Leaderboard>('/statistics/org/leaderboard', {
            params: cleanParams(filters),
        });
        return data;
    },

    // Demographics
    getDemographicsBy: async (
        dimension: 'gender' | 'education-form' | 'education-type' | 'education-lang' | 'payment-form',
        filters: StatsFilters = {}
    ): Promise<DemographicResponse> => {
        const { data } = await api.get<DemographicResponse>(`/statistics/demographics/${dimension}`, {
            params: cleanParams(filters),
        });
        return data;
    },
    getGpaCorrelation: async (filters: StatsFilters = {}): Promise<GpaCorrelation> => {
        const { data } = await api.get<GpaCorrelation>('/statistics/demographics/gpa-correlation', {
            params: cleanParams(filters),
        });
        return data;
    },
    getSemesterProgression: async (filters: StatsFilters = {}): Promise<SemesterProgression> => {
        const { data } = await api.get<SemesterProgression>('/statistics/demographics/semester-progression', {
            params: cleanParams(filters),
        });
        return data;
    },

    // Yakuniy
    getYakuniyDistribution: async (filters: StatsFilters = {}): Promise<YakuniyDistribution> => {
        const { data } = await api.get<YakuniyDistribution>('/statistics/yakuniy/distribution', {
            params: cleanParams(filters),
        });
        return data;
    },
    getYakuniyBySubject: async (filters: StatsFilters = {}): Promise<YakuniyBySubject> => {
        const { data } = await api.get<YakuniyBySubject>('/statistics/yakuniy/by-subject', {
            params: cleanParams(filters),
        });
        return data;
    },
    getYakuniyVsQuiz: async (filters: StatsFilters = {}): Promise<YakuniyVsQuiz> => {
        const { data } = await api.get<YakuniyVsQuiz>('/statistics/yakuniy/vs-quiz', {
            params: cleanParams(filters),
        });
        return data;
    },

    // Psychology
    getPsychologyCoverage: async (filters: StatsFilters = {}): Promise<PsychologyCoverage> => {
        const { data } = await api.get<PsychologyCoverage>('/statistics/psychology-stats/coverage', {
            params: cleanParams(filters),
        });
        return data;
    },
    getPsychologyPopularity: async (filters: StatsFilters = {}): Promise<PsychologyMethodPopularity> => {
        const { data } = await api.get<PsychologyMethodPopularity>('/statistics/psychology-stats/popularity', {
            params: cleanParams(filters),
        });
        return data;
    },
    getDiagnosisDistribution: async (
        method_id: number,
        filters: StatsFilters = {}
    ): Promise<DiagnosisDistribution> => {
        const { data } = await api.get<DiagnosisDistribution>(
            `/statistics/psychology-stats/method/${method_id}/diagnosis-distribution`,
            { params: cleanParams(filters) }
        );
        return data;
    },
    getPsychologyVsAcademic: async (
        method_id: number,
        filters: StatsFilters = {}
    ): Promise<PsychologyVsAcademic> => {
        const { data } = await api.get<PsychologyVsAcademic>(
            `/statistics/psychology-stats/method/${method_id}/vs-academic`,
            { params: cleanParams(filters) }
        );
        return data;
    },
    getPsychologyRiskGroup: async (
        method_id: number,
        label_substring?: string
    ): Promise<PsychologyRiskGroup> => {
        const { data } = await api.get<PsychologyRiskGroup>(
            `/statistics/psychology-stats/method/${method_id}/risk-group`,
            { params: cleanParams({ label_substring }) }
        );
        return data;
    },

    // Teacher activity
    getTeacherQuestionQuality: async (teacher_id: number): Promise<TeacherQuestionQuality> => {
        const { data } = await api.get<TeacherQuestionQuality>(
            `/statistics/teacher-activity/${teacher_id}/question-quality`
        );
        return data;
    },
    getTeacherActivity: async (
        teacher_id: number,
        granularity: 'day' | 'week' | 'month' = 'month'
    ): Promise<TeacherActivity> => {
        const { data } = await api.get<TeacherActivity>(`/statistics/teacher-activity/${teacher_id}/timeline`, {
            params: { granularity },
        });
        return data;
    },
    getTeacherProctoring: async (teacher_id: number): Promise<TeacherProctoring> => {
        const { data } = await api.get<TeacherProctoring>(
            `/statistics/teacher-activity/${teacher_id}/proctoring`
        );
        return data;
    },
};
