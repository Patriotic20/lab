import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    courseStructureService,
    type ModuleCreateRequest,
    type ModuleUpdateRequest,
    type ReorderItem,
    type TopicCreateRequest,
    type TopicUpdateRequest,
} from '@/services/courseStructureService';

export const useModules = (sinfId: number | undefined) =>
    useQuery({
        queryKey: ['modules', sinfId],
        queryFn: () => courseStructureService.listModules(sinfId!),
        enabled: !!sinfId,
    });

const invalidateModules = (qc: ReturnType<typeof useQueryClient>, sinfId: number | undefined) => {
    qc.invalidateQueries({ queryKey: ['modules', sinfId] });
};

export const useCreateModule = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ModuleCreateRequest) => courseStructureService.createModule(data),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};

export const useUpdateModule = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ModuleUpdateRequest }) =>
            courseStructureService.updateModule(id, data),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};

export const useDeleteModule = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => courseStructureService.deleteModule(id),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};

export const useReorderModules = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sinfId: id, items }: { sinfId: number; items: ReorderItem[] }) =>
            courseStructureService.reorderModules(id, items),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};

export const useCreateTopic = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: TopicCreateRequest) => courseStructureService.createTopic(data),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};

export const useUpdateTopic = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TopicUpdateRequest }) =>
            courseStructureService.updateTopic(id, data),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};

export const useDeleteTopic = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => courseStructureService.deleteTopic(id),
        onSuccess: () => invalidateModules(qc, sinfId),
    });
};
