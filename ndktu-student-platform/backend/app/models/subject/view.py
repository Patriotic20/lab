from sqladmin import ModelView
from app.models.subject.model import Subject


class SubjectView(ModelView, model=Subject):
    column_list = (
        "id",
        "name",
    )

    column_labels = {
        "id": "ID",
        "name": "Name",
    }

    column_formatters = {
        "created_at": Subject.created_at,
        "updated_at": Subject.updated_at,
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
        "subject_teachers",
        "results",
        "teachers",
        "questions",
        "quizzes",
        "created_at",
        "updated_at",
    ]