import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService, type TeacherCreateRequest, type TeacherFullCreateRequest } from '@/services/teacherService';

export const useTeachers = (page = 1, limit = 10, full_name?: string) => {
    return useQuery({
        queryKey: ['teachers', page, limit, full_name],
        queryFn: () => teacherService.getTeachers(page, limit, full_name),
        placeholderData: (previousData) => previousData,
    });
};

export const useTeacher = (id: number) => {
    return useQuery({
        queryKey: ['teacher', id],
        queryFn: () => teacherService.getTeacherById(id),
        enabled: !!id,
    });
};

export const useCreateTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TeacherCreateRequest) => teacherService.createTeacher(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        },
    });
};

export const useCreateTeacherWithUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TeacherFullCreateRequest) => teacherService.createTeacherWithUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        },
    });
};

export const useUpdateTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TeacherCreateRequest }) =>
            teacherService.updateTeacher(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            queryClient.invalidateQueries({ queryKey: ['teacher', data.id] });
        },
    });
};

export const useDeleteTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => teacherService.deleteTeacher(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        },
    });
}

export const useAssignGroups = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ user_id, group_ids }: { user_id: number; group_ids: number[] }) =>
            teacherService.assignGroups(user_id, group_ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        },
    });
};

export const useAssignSubjects = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ teacher_id, subject_ids }: { teacher_id: number; subject_ids: number[] }) =>
            teacherService.assignSubjects(teacher_id, subject_ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        },
    });
};

export const useTeacherAssignedGroups = (userId?: number) => {
    return useQuery({
        queryKey: ['teacherAssignedGroups', userId],
        queryFn: () => teacherService.getAssignedGroups(userId!),
        enabled: !!userId,
    });
};
