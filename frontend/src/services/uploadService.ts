import api from './api';

/**
 * Shared image upload service.
 *
 * Reuses the existing `POST /question/upload_image` endpoint which saves the
 * file under `/uploads/questions/<uuid>.ext` and returns a fully-qualified URL.
 * The endpoint requires `create:question` permission — Admin and Teacher roles
 * have it, so it covers every caller in the app today (question form,
 * psychology method builder, tutor profile, etc.).
 */
export const uploadService = {
    uploadImage: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ url: string }>('/question/upload_image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
