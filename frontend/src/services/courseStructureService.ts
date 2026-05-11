import api from './api';

export interface Topic {
    id: number;
    module_id: number;
    name: string;
    description?: string | null;
    order_index: number;
    hours?: number | null;
    learning_outcomes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Module {
    id: number;
    sinf_id: number;
    name: string;
    description?: string | null;
    order_index: number;
    topics: Topic[];
    created_at: string;
    updated_at: string;
}

export interface ModuleListResponse {
    modules: Module[];
}

export interface ModuleCreateRequest {
    sinf_id: number;
    name: string;
    description?: string | null;
    order_index?: number;
}

export interface ModuleUpdateRequest {
    name?: string;
    description?: string | null;
    order_index?: number;
}

export interface TopicCreateRequest {
    module_id: number;
    name: string;
    description?: string | null;
    order_index?: number;
    hours?: number | null;
    learning_outcomes?: string | null;
}

export interface TopicUpdateRequest {
    name?: string;
    description?: string | null;
    order_index?: number;
    hours?: number | null;
    learning_outcomes?: string | null;
}

export interface ReorderItem {
    id: number;
    order_index: number;
}

export const courseStructureService = {
    listModules: async (sinfId: number) => {
        const response = await api.get<ModuleListResponse>('/module/', { params: { sinf_id: sinfId } });
        return response.data;
    },
    createModule: async (data: ModuleCreateRequest) => {
        const response = await api.post<Module>('/module/', data);
        return response.data;
    },
    updateModule: async (id: number, data: ModuleUpdateRequest) => {
        const response = await api.put<Module>(`/module/${id}`, data);
        return response.data;
    },
    deleteModule: async (id: number) => {
        await api.delete(`/module/${id}`);
    },
    reorderModules: async (sinfId: number, items: ReorderItem[]) => {
        const response = await api.put<ModuleListResponse>(`/module/reorder/${sinfId}`, { items });
        return response.data;
    },

    createTopic: async (data: TopicCreateRequest) => {
        const response = await api.post<Topic>('/topic/', data);
        return response.data;
    },
    updateTopic: async (id: number, data: TopicUpdateRequest) => {
        const response = await api.put<Topic>(`/topic/${id}`, data);
        return response.data;
    },
    deleteTopic: async (id: number) => {
        await api.delete(`/topic/${id}`);
    },
    reorderTopics: async (moduleId: number, items: ReorderItem[]) => {
        const response = await api.put<Topic[]>(`/topic/reorder/${moduleId}`, { items });
        return response.data;
    },
};
