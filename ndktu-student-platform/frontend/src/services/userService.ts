import api from './api';
import type { User } from '@/types/auth';

export interface UserListResponse {
    total: number;
    page: number;
    limit: number;
    users: User[];
}

export const userService = {
    getUsers: async (page = 1, limit = 10, username?: string) => {
        const response = await api.get<UserListResponse>('/user/', {
            params: { page, limit, username },
        });
        return response.data;
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await api.get<User>(`/user/${id}`);
        return response.data;
    },

    createUser: async (userData: any) => {
        const response = await api.post('/user/', userData);
        return response.data;
    },

    updateUser: async (id: number, userData: any) => {
        const response = await api.put(`/user/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id: number) => {
        await api.delete(`/user/${id}`);
    },

    assignRoles: async (user_id: number, role_ids: number[]) => {
        const response = await api.post('/user/assign_role', { user_id, role_ids });
        return response.data;
    },

    syncHemisUsers: async () => {
        const response = await api.post('/user/sync-hemis');
        return response.data;
    },
};
