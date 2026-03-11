from sqladmin import ModelView
from app.models.results.model import Result


class ResultView(ModelView, model=Result):
    column_list = (
        "id",
        "user_id",
        "quiz_id",
        "subject_id",
        "group_id",
        "grade",
        "correct_answers",
        "wrong_answers",
    )
    column_labels = {
        "id": "ID",
        "user_id": "User",
        "quiz_id": "Quiz",
        "subject_id": "Subject",
        "group_id": "Group",
        "grade": "Grade",
        "correct_answers": "Correct",
        "wrong_answers": "Wrong",
    }

    column_formatters = {
        "created_at": Result.created_at,
        "updated_at": Result.updated_at,
    }

    column_searchable_list = (
        "grade",
    )

    column_sortable_list = (
        "id",
        "grade",
        "correct_answers",
        "wrong_answers",
    )

    column_default_sort = (
        "id",
        True,
    )

    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]
