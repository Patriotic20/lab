import { z } from 'zod';

export const teacherCreateSchema = z.object({
    first_name: z.string().min(1, 'Ism kiritilishi shart'),
    last_name: z.string().min(1, 'Familiya kiritilishi shart'),
    third_name: z.string().min(1, 'Otasining ismi kiritilishi shart'),
    kafedra_id: z.number().min(1, 'Kafedra tanlanishi shart'),
    username: z.string().min(3, 'Minimum 3 ta belgi'),
    password: z.string().min(4, 'Minimum 4 ta belgi'),
});

export const teacherUpdateSchema = z.object({
    first_name: z.string().min(1, 'Ism kiritilishi shart'),
    last_name: z.string().min(1, 'Familiya kiritilishi shart'),
    third_name: z.string().min(1, 'Otasining ismi kiritilishi shart'),
    kafedra_id: z.number().min(1, 'Kafedra tanlanishi shart'),
    user_id: z.number().min(1, 'Foydalanuvchi tanlanishi shart'),
});

export type TeacherCreateFormValues = z.infer<typeof teacherCreateSchema>;
export type TeacherUpdateFormValues = z.infer<typeof teacherUpdateSchema>;
