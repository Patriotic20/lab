import api from './api';

export interface StudentUser {
    student_id: number;
    user_id: number | null;
    username: string | null;
    is_active: boolean | null;
    first_name: string;
    last_name: string;
    full_name: string;
    student_id_number: string;
    phone: string | null;
    gender: string;
    faculty: string;
    level: string;
    semester: string;
    specialty: string;
    student_status: string;
    avg_gpa: number;
    group_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface StudentUserListResponse {
    total: number;
    page: number;
    limit: number;
    students: StudentUser[];
}

export const studentUserService = {
    getStudentUsers: async (
        page = 1,
        limit = 10,
        search?: string,
        groupId?: number
    ): Promise<StudentUserListResponse> => {
        const params: any = { page, limit };
        if (search) params.search = search;
        if (groupId) params.group_id = groupId;

        const response = await api.get<StudentUserListResponse>(
            '/students/with-users',
            { params }
        );
        return response.data;
    },
};
