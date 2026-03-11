from app.models.role_permission.model import RolePermission
from sqladmin import ModelView


class RolePermissionView(ModelView, model=RolePermission):
    column_list = (
        RolePermission.id,
        RolePermission.role_id,
        RolePermission.permission_id,
        RolePermission.created_at,
        RolePermission.updated_at,
    )

    column_labels = {
        RolePermission.id: "ID",
        RolePermission.role_id: "Role ID",
        RolePermission.permission_id: "Permission ID",
        RolePermission.created_at: "Created At",
        RolePermission.updated_at: "Updated At",
    }

    column_searchable_list = (
        RolePermission.role_id,
        RolePermission.permission_id,
    )

    column_editable_list = (
        RolePermission.role_id,
        RolePermission.permission_id,
    )

    column_sortable_list = (
        RolePermission.id,
        RolePermission.role_id,
        RolePermission.permission_id,
        RolePermission.created_at,
    )

    column_default_sort = (RolePermission.id, True)

    form_excluded_columns = (
        RolePermission.created_at,
        RolePermission.updated_at,
    )
