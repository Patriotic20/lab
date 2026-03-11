from app.models.user_role.model import UserRole
from sqladmin import ModelView


class UserRoleView(ModelView, model=UserRole):
    name = "User Role"
    name_plural = "User Roles"

    # Columns shown in list view
    column_list = (
        UserRole.id,
        UserRole.user,
        UserRole.role,
        UserRole.created_at,
        UserRole.updated_at,
    )

    # Column labels
    column_labels = {
        UserRole.id: "ID",
        UserRole.user: "User",
        UserRole.role: "Role",
        UserRole.created_at: "Created At",
        UserRole.updated_at: "Updated At",
    }

    # Enable search
    column_searchable_list = (
        UserRole.user_id,
        UserRole.role_id,
    )

    # Enable sorting
    column_sortable_list = (
        UserRole.id,
        UserRole.user_id,
        UserRole.role_id,
        UserRole.created_at,
    )

    # Default sorting
    column_default_sort = (UserRole.id, True)

    # Editable fields in admin
    column_editable_list = (
        UserRole.user_id,
        UserRole.role_id,
    )

    # Hide system fields in forms
    form_excluded_columns = (
        UserRole.created_at,
        UserRole.updated_at,
    )
