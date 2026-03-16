import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '@/services/facultyService';
import { kafedraService } from '@/services/kafedraService';
import { roleService } from '@/services/roleService';
import { permissionService } from '@/services/permissionService';

// Faculties
export const useFaculties = (page = 1, limit = 100, name?: string) => {
    return useQuery({
        queryKey: ['faculties', page, limit, name],
        queryFn: () => facultyService.getFaculties(page, limit, name),
    });
};

export const useCreateFaculty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string }) => facultyService.createFaculty(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculties'] });
        },
    });
};

export const useUpdateFaculty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string } }) => facultyService.updateFaculty(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculties'] });
        },
    });
};

export const useDeleteFaculty = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => facultyService.deleteFaculty(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculties'] });
        },
    });
};

// Kafedras
export const useKafedras = (page = 1, limit = 100, name?: string) => {
    return useQuery({
        queryKey: ['kafedras', page, limit, name],
        queryFn: () => kafedraService.getKafedras(page, limit, name),
    });
};

export const useCreateKafedra = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; faculty_id: number }) => kafedraService.createKafedra(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kafedras'] });
        },
    });
};

export const useUpdateKafedra = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string; faculty_id: number } }) => kafedraService.updateKafedra(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kafedras'] });
        },
    });
};

export const useDeleteKafedra = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => kafedraService.deleteKafedra(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kafedras'] });
        },
    });
};

// Roles
export const useRoles = (page = 1, limit = 100, name?: string) => {
    return useQuery({
        queryKey: ['roles', page, limit, name],
        queryFn: () => roleService.getRoles(page, limit, name),
    });
};

// Permissions
export const usePermissions = (page = 1, limit = 100, name?: string) => {
    return useQuery({
        queryKey: ['permissions', page, limit, name],
        queryFn: () => permissionService.getPermissions(page, limit, name),
    });
};

export const useAssignPermissions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ role_id, permission_ids }: { role_id: number; permission_ids: number[] }) =>
            roleService.assignPermissions(role_id, permission_ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
};
