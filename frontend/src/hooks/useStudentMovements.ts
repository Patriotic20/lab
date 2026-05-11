import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    studentMovementService,
    type StudentMovementCreateRequest,
} from '@/services/studentMovementService';

export const useStudentMovements = (studentId: number | undefined) =>
    useQuery({
        queryKey: ['student-movements', studentId],
        queryFn: () => studentMovementService.listForStudent(studentId!),
        enabled: !!studentId,
    });

export const useCreateStudentMovement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: StudentMovementCreateRequest) => studentMovementService.create(data),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['student-movements', data.student_id] });
            qc.invalidateQueries({ queryKey: ['students'] });
        },
    });
};

export const useDeleteStudentMovement = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => studentMovementService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['student-movements'] }),
    });
};
