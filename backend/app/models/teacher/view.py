from sqladmin import ModelView
from app.models.teacher.model import Teacher

class TeacherView(ModelView, model=Teacher):
    column_list = ("id", "last_name", "first_name", "third_name", "full_name")
    column_labels = {
        "id": "ID",
        "last_name": "Last Name",
        "first_name": "First Name",
        "third_name": "Third Name",
        "full_name": "Full Name",
    }
    column_formatters = {
        "created_at": lambda m, a: m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else "-",
        "updated_at": lambda m, a: m.updated_at.strftime("%Y-%m-%d %H:%M") if m.updated_at else "-",
    }
    column_searchable_list = ("first_name", "last_name", "full_name")
    column_editable_list = ("first_name", "last_name", "third_name")
    # column_sortable_list = ("id", "last_name", "first_name")
    column_default_sort = ("id", True)
    form_excluded_columns = [
        "subject_teachers",
        "teacher_groups",
        "subjects",
        "created_at",
        "updated_at",
    ]