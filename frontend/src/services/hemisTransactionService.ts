import api from './api';

export interface HemisTransaction {
    id: number;
    user_id: number | null;
    student_id: number | null;
    login: string;
    login_type: 'local' | 'hemis_api';
    status: 'success' | 'failed';
    ip_address: string;
    user_agent: string;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface HemisTransactionListResponse {
    total: number;
    page: number;
    limit: number;
    transactions: HemisTransaction[];
}

export interface HemisTransactionFilters {
    login?: string;
    login_type?: 'local' | 'hemis_api';
    status?: 'success' | 'failed';
}

export const hemisTransactionService = {
    getTransactions: async (
        page = 1,
        limit = 10,
        filters?: HemisTransactionFilters
    ): Promise<HemisTransactionListResponse> => {
        const params: any = { page, limit };
        if (filters?.login) params.login = filters.login;
        if (filters?.login_type) params.login_type = filters.login_type;
        if (filters?.status) params.status = filters.status;

        const response = await api.get<HemisTransactionListResponse>(
            '/hemis/transactions',
            { params }
        );
        return response.data;
    },

    getMyTransactions: async (page = 1, limit = 10): Promise<HemisTransactionListResponse> => {
        const response = await api.get<HemisTransactionListResponse>(
            '/hemis/transactions/my',
            { params: { page, limit } }
        );
        return response.data;
    },

    getTransactionById: async (id: number): Promise<HemisTransaction> => {
        const response = await api.get<HemisTransaction>(`/hemis/transactions/${id}`);
        return response.data;
    },
};
