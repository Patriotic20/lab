from sqladmin import ModelView
from app.models.question.model import Question


class QuestionView(ModelView, model=Question):
    column_list = (
        "id",
        "text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_option",
        "subject",
        "user",
    )

    column_labels = {
        "id": "ID",
        "text": "Text",
        "option_a": "Option A",
        "option_b": "Option B",
        "option_c": "Option C",
        "option_d": "Option D",
        "subject": "Subject",
        "user": "User",
    }

    column_formatters = {
        "created_at": Question.created_at,
        "updated_at": Question.updated_at,
    }

    column_searchable_list = (
        "text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
    )

    column_editable_list = (
        "text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_option",
        "subject",
        "user",
    )

    column_sortable_list = (
        "id",
        "text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_option",
        "subject",
        "user",
    )

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "user_answers",
        "quiz_questions",
        "created_at",
        "updated_at",
    ]