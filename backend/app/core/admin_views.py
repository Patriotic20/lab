from sqladmin import Admin, ModelView

from app.modules.psychology.model import PsychologyMethod, PsychologyQuestion


class PsychologyMethodAdmin(ModelView, model=PsychologyMethod):
    column_list = ["id", "name", "description", "created_at"]
    column_searchable_list = ["name", "description"]
    column_sortable_list = ["id", "name", "created_at"]
    column_default_sort = ("created_at", True)
    name = "Psixologiya metodi"
    name_plural = "Psixologiya metodlari"
    icon = "fa-brain"


class PsychologyQuestionAdmin(ModelView, model=PsychologyQuestion):
    column_list = ["id", "method_id", "question_type", "order", "created_at"]
    column_sortable_list = ["id", "method_id", "question_type", "order", "created_at"]
    column_default_sort = ("method_id", False)
    name = "Psixologiya savoli"
    name_plural = "Psixologiya savollari"
    icon = "fa-question-circle"


def register_models(admin: Admin):
    admin.add_view(PsychologyMethodAdmin)
    admin.add_view(PsychologyQuestionAdmin)
