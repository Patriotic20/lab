from sqladmin import ModelView
from app.models.subject.model import Subject

class SubjectView(ModelView, model=Subject):
    column_list = ("id", "name")
    column_labels = {
        "id": "ID",
        "name": "Name",
    }
    column_formatters = {
        "created_at": lambda m, a: m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else "-",
        "updated_at": lambda m, a: m.updated_at.strftime("%Y-%m-%d %H:%M") if m.updated_at else "-",
    }
    column_searchable_list = ("name",)
    column_editable_list = ("name",)
    # column_sortable_list = ("id", "name")
    column_default_sort = ("id", True)
    form_excluded_columns = [
        "subject_teachers",
        "results",
        "teachers",
        "questions",
        "quizzes",
        "created_at",
        "updated_at",
    ]