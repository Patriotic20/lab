export interface Kafedra {
    id: number;
    name: string;
}

export interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string;
    third_name: string;
    full_name: string;
    kafedra_id: number;
    kafedra: Kafedra;
}

export interface Group {
    id: number;
    name: string;
}

export interface Student {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string;
    third_name: string;
    full_name: string;
    image_path: string | null;
    group_id: number;
    group: Group;
    university: string | null;
    specialty: string | null;
    education_form: string | null;
    education_type: string | null;
    payment_form: string | null;
    education_lang: string | null;
    faculty: string | null;
    level: string | null;
    semester: string | null;
    address: string | null;
    avg_gpa: number | null;
}

export interface User {
    id: number;
    username: string;
    is_active: boolean;
    roles: Role[];
    teacher?: Teacher;
    student?: Student;
    created_at: string;
    updated_at: string;
}

export interface UserCreateRequest {
    username: string;
    password?: string;
    role_id: number;
    is_active: boolean;
}

export interface Role {
    id: number;
    name: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    type: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
