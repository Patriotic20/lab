from app.models.permission.model import Permission
from sqladmin import ModelView


class PermissionView(ModelView, model=Permission):
    column_list = (
        "id",
        "name",
    )

    column_labels = {
        "id": "ID",
        "name": "Name",
    }

    column_formatters = {
        "created_at": Permission.created_at,
        "updated_at": Permission.updated_at,
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
        "roles",
        "created_at",
        "updated_at",
    ]
