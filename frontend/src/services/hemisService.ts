import api from './api';

export interface HemisLoginRequest {
    login: string;
    password?: string;
    pin?: string; 
}

export interface HemisLoginResponse {
    access_token: string;
    refresh_token: string;
    type: string;
    // Add other fields if returned by the backend
}

export const hemisService = {
    login: async (data: HemisLoginRequest) => {
        const response = await api.post<HemisLoginResponse>('/hemis/login', data);
        return response.data;
    },
};
