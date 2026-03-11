from markupsafe import Markup
from app.models.student.model import Student
from sqladmin import ModelView


class StudentView(ModelView, model=Student):
    # Список колонок в таблице
    column_list = [
        "id",
        "image_path",  # Поле для форматированного фото
        "full_name",
        "student_id_number",
        "faculty",
        "specialty",
        "level",
        "student_status",
    ]


    column_formatters = {
        "image_path": lambda m, a: Markup(
            f'<img src="/{m.image_path}" width="50" height="50" '
            f'style="border-radius: 50%; object-fit: cover;">'
        )
        if m.image_path
        else "No Photo"
    }

    # Поиск и сортировка
    column_searchable_list = ["full_name", "student_id_number", "phone"]
    column_sortable_list = ["id", "full_name", "avg_gpa", "level"]
    column_default_sort = ("full_name", False)

    # Фильтры (добавляют боковую панель)
    # column_filters = [
    #     "faculty",
    #     "level",
    #     "student_status",
    #     "education_form",
    #     "education_lang",
    # ]

    # Экспорт данных
    can_export = True
    export_types = ["csv", "json"]

    # Названия полей (Labels)
    column_labels = {
        "full_name": "Full Name",
        "student_id_number": "ID Number",
        "image_path": "Photo",
        "avg_gpa": "GPA",
        "education_lang": "Language",
    }

    # Исключение полей из форм создания/редактирования
    form_excluded_columns = [
        "created_at",
        "updated_at",
    ]

    # Настройка количества записей
    page_size = 25
    page_size_options = [25, 50, 100]
