import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { yakuniyService, type YakuniyCreateRequest, type YakuniyUpdateRequest } from '@/services/yakuniyService';

export const useYakuniyList = (page = 1, limit = 10, subject_id?: number, user_id?: number, username?: string) => {
    return useQuery({
        queryKey: ['yakuniy', page, limit, subject_id, user_id, username],
        queryFn: () => yakuniyService.getYakuniyList(page, limit, subject_id, user_id, username),
        placeholderData: (previousData) => previousData,
    });
};

export const useYakuniy = (id: number) => {
    return useQuery({
        queryKey: ['yakuniy', id],
        queryFn: () => yakuniyService.getYakuniyById(id),
        enabled: !!id,
    });
};

export const useCreateYakuniy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: YakuniyCreateRequest) => yakuniyService.createYakuniy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['yakuniy'] });
        },
    });
};

export const useUpdateYakuniy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: YakuniyUpdateRequest }) => yakuniyService.updateYakuniy(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['yakuniy'] });
            queryClient.invalidateQueries({ queryKey: ['yakuniy', variables.id] });
        },
    });
};

export const useDeleteYakuniy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => yakuniyService.deleteYakuniy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['yakuniy'] });
        },
    });
};
