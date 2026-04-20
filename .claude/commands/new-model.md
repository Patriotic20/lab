# /new-model — Scaffold a new SQLAlchemy model

Scaffold a complete new model for the backend.

**Usage:** `/new-model ModelName field1:type field2:type ...`

**Field type tokens:**
- `str` → `String(255)` / `Mapped[str]`
- `text` → `Text` / `Mapped[str]`
- `int` → `Integer` / `Mapped[int]`
- `bool` → `Boolean` / `Mapped[bool]`
- `float` → `Float` / `Mapped[float]`
- `json` → `JSONB` / `Mapped[list]`
- `datetime` → `DateTime` / `Mapped[datetime]`
- `fk:ModelName` → `Integer + ForeignKey("tablename.id")` / `Mapped[int]`
- Append `:nullable` to any type to make the field optional, e.g. `note:text:nullable`

**Example:** `/new-model Notification user_id:fk:User message:str is_read:bool`

---

## Steps to execute

Given the arguments, perform ALL of the following steps in order:

### 1. Derive names
- `ModelName` as provided (PascalCase) → e.g. `Notification`
- `model_folder` = snake_case of ModelName → e.g. `notification`
- `table_name` = plural snake_case → e.g. `notifications`
- `ViewName` = `ModelName + "View"` → e.g. `NotificationView`

### 2. Create folder
Create the directory:
`backend/app/models/<model_folder>/`

### 3. Create `__init__.py`
Write an empty file at:
`backend/app/models/<model_folder>/__init__.py`

### 4. Create `model.py`
Write `backend/app/models/<model_folder>/model.py` following this exact pattern:

```python
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.mixins.id_int_pk import IdIntPk
from app.models.mixins.time_stamp_mixin import TimestampMixin

# if TYPE_CHECKING:
#     from app.models.other.model import Other  ← add only for fk: fields


class <ModelName>(Base, IdIntPk, TimestampMixin):
    __tablename__ = "<table_name>"

    # <generated columns here>

    def __str__(self):
        return f"<ModelName> {self.id}"
```

Rules:
- Only import SQLAlchemy types actually used by the fields
- For `fk:ModelName` fields: add a `ForeignKey` column + a `relationship` back_populates stub (use `"<RelatedModel>"` string, add TYPE_CHECKING import)
- Nullable fields use `Mapped[str | None]` and `nullable=True`
- Add `index=True` to all ForeignKey columns

### 5. Create `view.py`
Write `backend/app/models/<model_folder>/view.py` following this exact pattern:

```python
from sqladmin import ModelView
from app.models.<model_folder>.model import <ModelName>


class <ViewName>(ModelView, model=<ModelName>):
    column_list = (
        "id",
        # all field names
        "created_at",
    )
    column_labels = {
        "id": "ID",
        # field: "Label" for each field
        "created_at": "Yaratilgan",
    }

    column_searchable_list = ()   # add str/text fields here
    column_sortable_list = ("id", "created_at")
    column_default_sort = ("id", True)
    form_excluded_columns = ["created_at", "updated_at"]
```

### 6. Register in `models/__init__.py`
Edit `backend/app/models/__init__.py`:
- Add `"<ModelName>"` to the `__all__` list
- Append `from .<model_folder>.model import <ModelName>` at the end of the imports

### 7. Register in `models/views.py`
Edit `backend/app/models/views.py`:
- Add `from app.models.<model_folder>.view import <ViewName>` with the other imports
- Add `admin.add_view(<ViewName>)` inside `register_models()`

### 8. Create Alembic migration
Run:
```bash
cd /home/bekzod/Projects/Production/ndktu-student-face-platform && make migrate MSG="add <model_folder> model"
```

### 9. Report
Print a summary table of all files created/modified and the migration command that ran.
