import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/groupService';

export const useGroups = (page: number, limit: number, search: string, teacherId?: number) => {
    return useQuery({
        queryKey: ['groups', page, limit, search, teacherId],
        queryFn: () => groupService.getGroups(page, limit, search, teacherId),
        placeholderData: (previousData) => previousData,
    });
};

export const useGroupStudents = (groupId: number | undefined, search?: string) => {
    return useQuery({
        queryKey: ['group-students', groupId, search],
        queryFn: () => groupService.getGroupStudents(groupId!, 1, 200, search),
        enabled: !!groupId,
        placeholderData: (previousData) => previousData,
    });
};

export const useGroup = (id: number) => {
    return useQuery({
        queryKey: ['group', id],
        queryFn: () => groupService.getGroupById(id),
        enabled: !!id,
    });
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; faculty_id: number }) => groupService.createGroup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
};

export const useUpdateGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string; faculty_id: number } }) =>
            groupService.updateGroup(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['group', data.id] });
        },
    });
};

export const useDeleteGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => groupService.deleteGroup(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
};
