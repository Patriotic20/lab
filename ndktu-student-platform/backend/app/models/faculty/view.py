from sqladmin import ModelView
from app.models.faculty.model import Faculty

class FacultyView(ModelView, model=Faculty):
    column_list = (
        "id",
        "name",
    )

    column_labels = {
        "id": "ID",
        "name": "Name",
    }

    column_formatters = {
        "created_at": Faculty.created_at,
        "updated_at": Faculty.updated_at,
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
        "kafedras",
        "groups",
        "created_at",
        "updated_at",
    ]