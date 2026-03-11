from sqladmin import ModelView
from app.models.teacher.model import Teacher


class TeacherView(ModelView, model=Teacher):
    column_list = (
        "id",
        "last_name",
        "first_name",
        "third_name",
        "full_name",
    )

    column_labels = {
        "id": "ID",
        "last_name": "Last Name",
        "first_name": "First Name",
        "third_name": "Third Name",
        "full_name": "Full Name",
    }

    column_formatters = {
        "created_at": Teacher.created_at,
        "updated_at": Teacher.updated_at,
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
        "teacher_groups",
        "subjects",
        "created_at",
        "updated_at",
    ]