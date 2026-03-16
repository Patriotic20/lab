from sqladmin import ModelView
from app.models.kafedra.model import Kafedra


class KafedraView(ModelView, model=Kafedra):
    column_list = (
        "id",
        "name",
    )

    column_labels = {
        "id": "ID",
        "name": "Name",
    }

    column_formatters = {
        "created_at": Kafedra.created_at,
        "updated_at": Kafedra.updated_at,
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
        "teachers",
        "created_at",
        "updated_at",
    ]
