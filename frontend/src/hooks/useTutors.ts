import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    tutorService,
    type TutorCreateRequest,
    type TutorFullCreateRequest,
    type TutorUpdateRequest,
} from '@/services/tutorService';

export const useTutors = (page = 1, limit = 10, search?: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['tutors', page, limit, search],
        queryFn: () => tutorService.getTutors(page, limit, search),
        placeholderData: (previousData) => previousData,
        enabled,
    });
};

export const useTutor = (id: number) => {
    return useQuery({
        queryKey: ['tutor', id],
        queryFn: () => tutorService.getTutorById(id),
        enabled: !!id,
    });
};

export const useCreateTutor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TutorCreateRequest) => tutorService.createTutor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tutors'] });
        },
    });
};

export const useCreateTutorWithUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TutorFullCreateRequest) => tutorService.createTutorWithUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tutors'] });
        },
    });
};

export const useUpdateTutor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: TutorUpdateRequest }) =>
            tutorService.updateTutor(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tutors'] });
            queryClient.invalidateQueries({ queryKey: ['tutor', data.id] });
        },
    });
};

export const useDeleteTutor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => tutorService.deleteTutor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tutors'] });
        },
    });
};

export const useAssignTutorGroups = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tutor_id, group_ids }: { tutor_id: number; group_ids: number[] }) =>
            tutorService.assignGroups(tutor_id, group_ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tutors'] });
        },
    });
};
