import api from './api';

export interface ResourceLink {
    title: string;
    url: string;
}

export interface ResourceSubjectTeacherInfo {
    id: number;
    subject_id: number;
    teacher_id: number;
}

export interface ResourceResponse {
    id: number;
    subject_teacher_id: number;
    main_text: string;
    links: ResourceLink[];
    created_at: string;
    updated_at: string;
    subject_teacher?: ResourceSubjectTeacherInfo;
}

export interface ResourceListResponse {
    total: number;
    page: number;
    limit: number;
    resources: ResourceResponse[];
}

export interface ResourceCreateRequest {
    subject_teacher_id: number;
    main_text: string;
    links: ResourceLink[];
}

export interface ResourceUpdateRequest {
    main_text?: string;
    links?: ResourceLink[];
}

export const resourceService = {
    list: async (params: { page?: number; limit?: number; subject_teacher_id?: number }) => {
        const response = await api.get<ResourceListResponse>('/resource/', { params });
        return response.data;
    },

    get: async (id: number) => {
        const response = await api.get<ResourceResponse>(`/resource/${id}`);
        return response.data;
    },

    create: async (data: ResourceCreateRequest) => {
        const response = await api.post<ResourceResponse>('/resource/', data);
        return response.data;
    },

    update: async (id: number, data: ResourceUpdateRequest) => {
        const response = await api.put<ResourceResponse>(`/resource/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/resource/${id}`);
    },
};
