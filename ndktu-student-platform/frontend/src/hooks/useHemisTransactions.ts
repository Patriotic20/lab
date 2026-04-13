import { useQuery } from '@tanstack/react-query';
import { hemisTransactionService, type HemisTransactionFilters } from '@/services/hemisTransactionService';

export const useHemisTransactions = (
    page = 1,
    limit = 10,
    filters?: HemisTransactionFilters
) => {
    return useQuery({
        queryKey: ['hemis-transactions', page, limit, filters],
        queryFn: () => hemisTransactionService.getTransactions(page, limit, filters),
        placeholderData: (previousData) => previousData,
    });
};

export const useMyHemisTransactions = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['my-hemis-transactions', page, limit],
        queryFn: () => hemisTransactionService.getMyTransactions(page, limit),
        placeholderData: (previousData) => previousData,
    });
};

export const useHemisTransaction = (id: number) => {
    return useQuery({
        queryKey: ['hemis-transaction', id],
        queryFn: () => hemisTransactionService.getTransactionById(id),
        enabled: !!id,
    });
};
