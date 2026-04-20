import api from './api';

export interface TutorGroupLink {
    group_id: number;
    group: { id: number; name: string };
}

export interface Tutor {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    third_name: string;
    image_url?: string | null;
    phone_number?: string | null;
    created_at: string;
    updated_at: string;
    user?: { id: number; username: string };
    tutor_groups?: TutorGroupLink[];
}

export interface TutorCreateRequest {
    user_id: number;
    first_name: string;
    last_name: string;
    third_name: string;
    image_url?: string | null;
    phone_number?: string | null;
}

export interface TutorFullCreateRequest {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    third_name: string;
    image_url?: string | null;
    phone_number?: string | null;
}

export interface TutorUpdateRequest {
    first_name?: string;
    last_name?: string;
    third_name?: string;
    image_url?: string | null;
    phone_number?: string | null;
}

export interface TutorListResponse {
    total: number;
    page: number;
    limit: number;
    tutors: Tutor[];
}

export const tutorService = {
    getTutors: async (page = 1, limit = 10, search?: string) => {
        const response = await api.get<TutorListResponse>('/tutor/', {
            params: { page, limit, search: search || undefined },
        });
        return response.data;
    },

    getTutorById: async (id: number): Promise<Tutor> => {
        const response = await api.get<Tutor>(`/tutor/${id}`);
        return response.data;
    },

    createTutor: async (data: TutorCreateRequest) => {
        const response = await api.post<Tutor>('/tutor/', data);
        return response.data;
    },

    createTutorWithUser: async (data: TutorFullCreateRequest): Promise<Tutor> => {
        const userResponse = await api.post('/user/', {
            username: data.username,
            password: data.password,
            roles: [],
        });
        const user_id: number = userResponse.data.id;

        const tutorResponse = await api.post<Tutor>('/tutor/', {
            user_id,
            first_name: data.first_name,
            last_name: data.last_name,
            third_name: data.third_name,
            image_url: data.image_url || null,
            phone_number: data.phone_number || null,
        });
        return tutorResponse.data;
    },

    updateTutor: async (id: number, data: TutorUpdateRequest) => {
        const response = await api.put<Tutor>(`/tutor/${id}`, data);
        return response.data;
    },

    deleteTutor: async (id: number) => {
        await api.delete(`/tutor/${id}`);
    },

    assignGroups: async (tutor_id: number, group_ids: number[]) => {
        const response = await api.post('/tutor/assign_groups', { tutor_id, group_ids });
        return response.data;
    },

    getTutorWithGroups: async (id: number): Promise<Tutor> => {
        const response = await api.get<Tutor>(`/tutor/${id}/groups`);
        return response.data;
    },
};
