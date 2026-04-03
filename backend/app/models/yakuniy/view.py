from sqladmin import ModelView
from app.models.yakuniy.model import Yakuniy


class YakuniyView(ModelView, model=Yakuniy):
    column_list = (
        "id",
        "user_id",
        "subject_id",
        "grade",
    )
    column_labels = {
        "id": "ID",
        "user_id": "User",
        "subject_id": "Subject",
        "grade": "Grade",
    }

    column_searchable_list = (
        "grade",
    )

    column_sortable_list = (
        "id",
        "grade",
    )

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]
