import api from './api';

export interface Quiz {
    id: number;
    title: string;
    question_number: number;
    duration: number; // in minutes
    pin: string;
    user_id?: number;
    group_id?: number;
    subject_id?: number;
    is_active: boolean;
    attempt?: number | null;
    created_at: string;
    updated_at: string;
}

export interface QuizCreateRequest {
    title: string;
    question_number: number;
    duration: number;
    pin: string;
    user_id?: number | null;
    group_id?: number | null;
    subject_id?: number | null;
    is_active: boolean;
    attempt?: number | null;
}

export interface QuizListResponse {
    total: number;
    page: number;
    limit: number;
    quizzes: Quiz[];
}

export const quizService = {
    getQuizzes: async (page = 1, limit = 10, title?: string, is_active?: boolean, user_id?: number, group_id?: number, subject_id?: number) => {
        const response = await api.get<QuizListResponse>('/quiz/', {
            params: { page, limit, title, is_active, user_id, group_id, subject_id },
        });
        return response.data;
    },

    getQuizById: async (id: number): Promise<Quiz> => {
        const response = await api.get<Quiz>(`/quiz/${id}`);
        return response.data;
    },

    createQuiz: async (data: QuizCreateRequest) => {
        const response = await api.post('/quiz/', data);
        return response.data;
    },

    updateQuiz: async (id: number, data: QuizCreateRequest) => {
        const response = await api.put(`/quiz/${id}`, data);
        return response.data;
    },

    deleteQuiz: async (id: number) => {
        await api.delete(`/quiz/${id}`);
    },
};
