import api from './api';

export interface SinfSubjectInfo {
    id: number;
    name: string;
}

export interface SinfTeacherInfo {
    id: number;
    username: string;
    full_name?: string | null;
}

export interface SinfGroupInfo {
    id: number;
    name: string;
}

export interface SinfAcademicYearInfo {
    id: number;
    name: string;
}

export interface Sinf {
    id: number;
    name: string;
    description?: string | null;
    subject_id: number;
    teacher_id: number;
    academic_year_id?: number | null;
    semester_number?: number | null;
    subject?: SinfSubjectInfo | null;
    teacher?: SinfTeacherInfo | null;
    academic_year?: SinfAcademicYearInfo | null;
    groups: SinfGroupInfo[];
    created_at: string;
    updated_at: string;
}

export interface SinfListResponse {
    total: number;
    page: number;
    limit: number;
    sinfs: Sinf[];
}

export interface SinfCreateRequest {
    name: string;
    subject_id: number;
    teacher_id: number;
    description?: string | null;
    academic_year_id?: number | null;
    semester_number?: 1 | 2 | null;
    group_ids: number[];
}

export interface SinfUpdateRequest {
    name?: string;
    subject_id?: number;
    teacher_id?: number;
    description?: string | null;
    academic_year_id?: number | null;
    semester_number?: 1 | 2 | null;
    group_ids?: number[];
}

export interface SinfListParams {
    teacher_id?: number;
    subject_id?: number;
    group_id?: number;
    academic_year_id?: number;
    semester_number?: number;
    page?: number;
    limit?: number;
}

export const sinfService = {
    list: async (params?: SinfListParams) => {
        const response = await api.get<SinfListResponse>('/sinf/', { params });
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get<Sinf>(`/sinf/${id}`);
        return response.data;
    },
    create: async (data: SinfCreateRequest) => {
        const response = await api.post<Sinf>('/sinf/', data);
        return response.data;
    },
    update: async (id: number, data: SinfUpdateRequest) => {
        const response = await api.put<Sinf>(`/sinf/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/sinf/${id}`);
    },
};
