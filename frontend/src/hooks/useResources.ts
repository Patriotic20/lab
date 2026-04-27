import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    resourceService,
    type ResourceCreateRequest,
    type ResourceUpdateRequest,
} from '@/services/resourceService';

export const useResources = (
    page = 1,
    limit = 20,
    subject_teacher_id?: number,
    group_id?: number,
) =>
    useQuery({
        queryKey: ['resources', page, limit, subject_teacher_id, group_id],
        queryFn: () => resourceService.list({ page, limit, subject_teacher_id, group_id }),
    });

export const useResource = (id: number) =>
    useQuery({
        queryKey: ['resource', id],
        queryFn: () => resourceService.get(id),
        enabled: !!id,
    });

export const useCreateResource = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ResourceCreateRequest) => resourceService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
    });
};

export const useUpdateResource = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ResourceUpdateRequest }) =>
            resourceService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
    });
};

export const useDeleteResource = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => resourceService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
    });
};
