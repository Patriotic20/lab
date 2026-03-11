import { useQuery } from '@tanstack/react-query';
import { userAnswerService } from '@/services/userAnswerService';

export const useUserAnswers = (params: {
    page?: number;
    limit?: number;
    user_id?: number;
    quiz_id?: number;
}) => {
    return useQuery({
        queryKey: ['userAnswers', params],
        queryFn: () => userAnswerService.getUserAnswers(params),
        enabled: !!(params.user_id || params.quiz_id),
        placeholderData: (previousData) => previousData,
    });
};
