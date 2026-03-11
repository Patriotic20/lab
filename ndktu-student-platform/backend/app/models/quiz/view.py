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
        "created_at": Quiz.created_at,
        "updated_at": Quiz.updated_at,
    }

    column_searchable_list = (
        "title",
        "question_number",
        "duration",
        "pin",
        "is_active",
        "user",
        "group",
        "subject",
    )

    column_editable_list = (
        "title",
        "question_number",
        "duration",
        "pin",
        "is_active",
        "user",
        "group",
        "subject",
    )

    column_sortable_list = (
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

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "user_answers",
        "results",
        "quiz_questions",
        "created_at",
        "updated_at",
    ]