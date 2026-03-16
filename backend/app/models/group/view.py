from sqladmin import ModelView
from app.models.group.model import Group


class GroupView(ModelView, model=Group):
    column_list = (
        "id",
        "name",
    )

    column_labels = {
        "id": "ID",
        "name": "Name",
    }

    column_formatters = {
        "created_at": Group.created_at,
        "updated_at": Group.updated_at,
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
        "results",
        "group_teachers",
        "quizzes",
        "students",
        "created_at",
        "updated_at",
    ]