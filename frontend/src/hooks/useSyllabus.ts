import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syllabusService, type SyllabusUpsertRequest } from '@/services/syllabusService';

export const useSyllabus = (sinfId: number | undefined) =>
    useQuery({
        queryKey: ['syllabus', sinfId],
        queryFn: () => syllabusService.get(sinfId!),
        enabled: !!sinfId,
    });

export const useUpsertSyllabus = (sinfId: number | undefined) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: SyllabusUpsertRequest) => syllabusService.upsert(sinfId!, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['syllabus', sinfId] }),
    });
};
