from app.models.user.model import User
from passlib.context import CryptContext
from sqladmin import ModelView

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserView(ModelView, model=User):
    column_list = (
        "id",
        "username",
        "password",
    )

    column_labels = {
        "id": "ID",
        "username": "Username",
        "password": "Password",
    }

    form_excluded_columns = [
        "group_teachers",
        "user_answers",
        "teacher",
        "questions",
        "quizzes",
        "results",
        "student",
        "created_at",
        "updated_at",
    ]


    column_searchable_list = ("username",)

    column_editable_list = (
        "username",
        "password",
    )

    column_sortable_list = (
        "id",
        "username",
    )

    column_default_sort = (
        "id",
        True,
    )



    async def on_model_change(self, data, model, is_created, request):
        # Check if the password is being sent in the form
        if "password" in data:
            # Hash the plain text password
            data["password"] = pwd_context.hash(data["password"])

        # If updating an existing user and password field is empty,
        # you might want to remove it from 'data' so it doesn't overwrite
        # the hash with an empty string.
        elif not is_created:
            data.pop("password", None)
