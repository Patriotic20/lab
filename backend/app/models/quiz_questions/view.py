from sqladmin import ModelView
from app.models.quiz_questions.model import QuizQuestion


class QuizQuestionView(ModelView, model=QuizQuestion):
    column_list = (
        "id",
        "quiz_id",
        "question_id",
    )   
    column_labels = {
        "id": "ID",
        "quiz_id": "Quiz ID",
        "question_id": "Question ID",
    }

    column_formatters = {
        "created_at": QuizQuestion.created_at,
        "updated_at": QuizQuestion.updated_at,
    }

    column_searchable_list = (
        "quiz_id",
        "question_id",
    )

    column_editable_list = (
        "quiz_id",
        "question_id",
    )

    column_sortable_list = (
        "id",
        "quiz_id",
        "question_id",
    )

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]