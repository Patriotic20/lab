from sqladmin import ModelView
from app.models.quiz.model import Quiz

class QuizView(ModelView, model=Quiz):
    column_list = (
        "id",
        "title",
        "question_number",
        "duration",
        "pin",
        "is_active",
        "user",
        "group",
        "subject",
    )
    column_labels = {
        "id": "ID",
        "title": "Title",
        "question_number": "Question Number",
        "duration": "Duration",
        "pin": "Pin",
        "is_active": "Is Active",
        "user": "User",
        "group": "Group",
        "subject": "Subject",
    }
    column_formatters = {
        "created_at": lambda m, a: m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else "-",
        "updated_at": lambda m, a: m.updated_at.strftime("%Y-%m-%d %H:%M") if m.updated_at else "-",
    }
    # ✅ Only scalar columns — relationships can't be searched
    column_searchable_list = (
        "title",
        "pin",
    )
    # ✅ Only simple scalar columns — relationships can't be inline-edited
    column_editable_list = (
        "title",
        "question_number",
        "duration",
        "pin",
        "is_active",
    )
    # ✅ Only scalar columns — relationships can't be sorted
    # column_sortable_list = (
    #     "id",
    #     "title",
    #     "question_number",
    #     "duration",
    #     "pin",
    #     "is_active",
    # )
    column_default_sort = ("id", True)
    form_excluded_columns = [
        "user_answers",
        "results",
        "quiz_questions",
        "created_at",
        "updated_at",
    ]