from sqladmin import ModelView
from app.models.user_answers.model import UserAnswers

class UserAnswersView(ModelView, model=UserAnswers):
    column_list = [
        UserAnswers.id,
        UserAnswers.user,
        UserAnswers.quiz,
        UserAnswers.question,
        UserAnswers.answer,
        UserAnswers.is_correct,
    ]
    
    column_searchable_list = [
        UserAnswers.answer,
    ]

    column_sortable_list = [
        UserAnswers.id,
        UserAnswers.is_correct,
    ]

    column_default_sort = ("id", True)

    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]