import { useQuery } from '@tanstack/react-query';
import { studentUserService } from '@/services/studentUserService';

export const useStudentUsers = (
    page = 1,
    limit = 10,
    search?: string,
    groupId?: number
) => {
    return useQuery({
        queryKey: ['student-users', page, limit, search, groupId],
        queryFn: () => studentUserService.getStudentUsers(page, limit, search, groupId),
        placeholderData: (previousData) => previousData,
    });
};
