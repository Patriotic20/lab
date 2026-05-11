import api from './api';

export interface LiteratureItem {
    title: string;
    author?: string | null;
    year?: number | null;
    type?: string | null;
}

export interface Syllabus {
    id: number;
    sinf_id: number;
    goals?: string | null;
    learning_outcomes?: string | null;
    prerequisites?: string | null;
    methodical_recommendations?: string | null;
    literature: LiteratureItem[];
    grading_scheme: Record<string, number>;
    competencies: string[];
    file_url?: string | null;
    file_name?: string | null;
    created_at: string;
    updated_at: string;
}

export interface SyllabusUpsertRequest {
    goals?: string | null;
    learning_outcomes?: string | null;
    prerequisites?: string | null;
    methodical_recommendations?: string | null;
    literature: LiteratureItem[];
    grading_scheme: Record<string, number>;
    competencies: string[];
    file_url?: string | null;
    file_name?: string | null;
}

export const syllabusService = {
    get: async (sinfId: number) => {
        try {
            const response = await api.get<Syllabus>(`/syllabus/${sinfId}`);
            return response.data;
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } } | null)?.response?.status;
            if (status === 404) return null;
            throw e;
        }
    },
    upsert: async (sinfId: number, data: SyllabusUpsertRequest) => {
        const response = await api.put<Syllabus>(`/syllabus/${sinfId}`, data);
        return response.data;
    },
    delete: async (sinfId: number) => {
        await api.delete(`/syllabus/${sinfId}`);
    },
};
