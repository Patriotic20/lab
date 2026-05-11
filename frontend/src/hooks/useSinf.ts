import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    sinfService,
    type SinfCreateRequest,
    type SinfListParams,
    type SinfUpdateRequest,
} from '@/services/sinfService';

export const useSinfs = (params?: SinfListParams) => {
    return useQuery({
        queryKey: ['sinfs', params],
        queryFn: () => sinfService.list(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useSinf = (id: number | undefined) => {
    return useQuery({
        queryKey: ['sinf', id],
        queryFn: () => sinfService.getById(id!),
        enabled: !!id,
    });
};

export const useCreateSinf = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SinfCreateRequest) => sinfService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sinfs'] });
        },
    });
};

export const useUpdateSinf = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SinfUpdateRequest }) => sinfService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sinfs'] });
            queryClient.invalidateQueries({ queryKey: ['sinf', data.id] });
        },
    });
};

export const useDeleteSinf = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => sinfService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sinfs'] });
        },
    });
};
