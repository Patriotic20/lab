from sqladmin import ModelView
from app.models.group_teachers.model import GroupTeacher


class GroupTeacherView(ModelView, model=GroupTeacher):
    column_list = [
        GroupTeacher.id,
        GroupTeacher.group,
        GroupTeacher.teacher,
    ]
    
    column_labels = {   
        "group": "Group",
        "teacher": "Teacher",
    }

    column_formatters = {
        "created_at": GroupTeacher.created_at,
        "updated_at": GroupTeacher.updated_at,
    }

    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]