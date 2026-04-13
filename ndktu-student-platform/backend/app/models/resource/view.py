from sqladmin import ModelView
from app.models.resource.model import Resource


class ResourceView(ModelView, model=Resource):
    column_list = (
        "id",
        "subject_teacher_id",
        "main_text",
        "created_at",
    )
    column_labels = {
        "id": "ID",
        "subject_teacher_id": "Fan/O'qituvchi",
        "main_text": "Asosiy matn",
        "created_at": "Yaratilgan",
    }

    column_searchable_list = ("main_text",)

    column_sortable_list = ("id", "created_at")

    column_default_sort = ("id", True)

    form_excluded_columns = ["created_at", "updated_at"]
