import api from './api';

export type MovementType =
    | 'enrollment'
    | 'transfer'
    | 'leave'
    | 'return'
    | 'expulsion'
    | 'graduation';

export interface GroupShortInfo {
    id: number;
    name: string;
}

export interface StudentMovement {
    id: number;
    student_id: number;
    movement_type: MovementType;
    from_group_id?: number | null;
    to_group_id?: number | null;
    from_status?: string | null;
    to_status?: string | null;
    order_number?: string | null;
    order_date?: string | null;
    effective_date: string;
    reason?: string | null;
    created_by_user_id?: number | null;
    from_group?: GroupShortInfo | null;
    to_group?: GroupShortInfo | null;
    created_at: string;
    updated_at: string;
}

export interface StudentMovementListResponse {
    movements: StudentMovement[];
}

export interface StudentMovementCreateRequest {
    student_id: number;
    movement_type: MovementType;
    from_group_id?: number | null;
    to_group_id?: number | null;
    from_status?: string | null;
    to_status?: string | null;
    order_number?: string | null;
    order_date?: string | null;
    effective_date: string;
    reason?: string | null;
}

export const studentMovementService = {
    listForStudent: async (studentId: number) => {
        const response = await api.get<StudentMovementListResponse>(
            `/student-movement/student/${studentId}`,
        );
        return response.data;
    },
    create: async (data: StudentMovementCreateRequest) => {
        const response = await api.post<StudentMovement>('/student-movement/', data);
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/student-movement/${id}`);
    },
};
