from app.models.role.model import Role
from sqladmin import ModelView


class RoleView(ModelView, model=Role):
    column_list = (
        "id",
        "name",
    )

    column_labels = {
        "id": "ID",
        "name": "Name",
    }

    column_formatters = {
        "created_at": Role.created_at,
        "updated_at": Role.updated_at,
    }

    column_searchable_list = ("name",)

    column_editable_list = ("name",)

    column_sortable_list = (
        "id",
        "name",
    )

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "users",
        "created_at",
        "updated_at",
    ]
