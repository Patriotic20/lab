from sqladmin import ModelView
from app.models.subject_teacher.model import SubjectTeacher


class SubjectTeacherView(ModelView, model=SubjectTeacher):
    column_list = (
        "id",
        "subject_id",
        "teacher_id",
    )

    column_labels = {
        "id": "ID",
        "subject_id": "Subject ID",
        "teacher_id": "Teacher ID",
    }

    column_formatters = {
        "created_at": SubjectTeacher.created_at,
        "updated_at": SubjectTeacher.updated_at,
    }

    column_searchable_list = (
        "subject_id",
        "teacher_id",
    )

    column_editable_list = (
        "subject_id",
        "teacher_id",
    )

    column_sortable_list = (
        "id",
        "subject_id",
        "teacher_id",
    )

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]