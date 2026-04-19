import api from './api';

export interface Yakuniy {
    id: number;
    user_id: number;
    subject_id: number;
    grade: number;
    created_at: string;
    updated_at: string;
    user?: { id: number; username: string } | null;
    subject?: { id: number; name: string } | null;
    student_name?: string | null;
}

export interface YakuniyCreateRequest {
    user_id: number;
    subject_id: number;
    grade: number;
}

export interface YakuniyUpdateRequest {
    user_id?: number;
    subject_id?: number;
    grade?: number;
}

export interface YakuniyListResponse {
    total: number;
    page: number;
    limit: number;
    yakuniy_results: Yakuniy[];
}

export const yakuniyService = {
    getYakuniyList: async (page = 1, limit = 10, subject_id?: number, user_id?: number, username?: string) => {
        const response = await api.get<YakuniyListResponse>('/yakuniy/', {
            params: { page, limit, subject_id, user_id, username },
        });
        return response.data;
    },

    getYakuniyById: async (id: number): Promise<Yakuniy> => {
        const response = await api.get<Yakuniy>(`/yakuniy/${id}`);
        return response.data;
    },

    createYakuniy: async (data: YakuniyCreateRequest): Promise<Yakuniy> => {
        const response = await api.post<Yakuniy>('/yakuniy/', data);
        return response.data;
    },

    updateYakuniy: async (id: number, data: YakuniyUpdateRequest): Promise<Yakuniy> => {
        const response = await api.put<Yakuniy>(`/yakuniy/${id}`, data);
        return response.data;
    },

    deleteYakuniy: async (id: number): Promise<void> => {
        await api.delete(`/yakuniy/${id}`);
    },
};
