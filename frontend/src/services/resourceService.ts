import api from './api';

export interface ResourceLink {
    title: string;
    url: string;
}

export interface ResourceFile {
    name: string;
    url: string;
    type: string;
}

export interface ResourceSubjectTeacherInfo {
    id: number;
    subject_id: number;
    teacher_id: number;
}

export interface ResourceGroupInfo {
    id: number;
    name: string;
}

export interface ResourceResponse {
    id: number;
    subject_teacher_id: number;
    group_id?: number | null;
    lesson_id?: number | null;
    sinf_id?: number | null;
    topic_id?: number | null;
    main_text: string;
    links: ResourceLink[];
    files: ResourceFile[];
    created_at: string;
    updated_at: string;
    subject_teacher?: ResourceSubjectTeacherInfo;
    group?: ResourceGroupInfo | null;
}

export interface ResourceListResponse {
    total: number;
    page: number;
    limit: number;
    resources: ResourceResponse[];
}

export interface ResourceCreateRequest {
    subject_teacher_id?: number;
    group_id?: number | null;
    lesson_id?: number | null;
    sinf_id?: number | null;
    topic_id?: number | null;
    main_text: string;
    links: ResourceLink[];
    files: ResourceFile[];
}

export interface ResourceUpdateRequest {
    main_text?: string;
    links?: ResourceLink[];
    files?: ResourceFile[];
    group_id?: number | null;
    subject_teacher_id?: number;
    lesson_id?: number | null;
    sinf_id?: number | null;
    topic_id?: number | null;
}

export const resourceService = {
    list: async (params: { page?: number; limit?: number; subject_teacher_id?: number; group_id?: number; lesson_id?: number; sinf_id?: number; topic_id?: number }) => {
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

    uploadFile: async (file: File): Promise<ResourceFile> => {
        const form = new FormData();
        form.append('file', file);
        const response = await api.post<ResourceFile>('/resource/upload', form);
        return response.data;
    },
};
