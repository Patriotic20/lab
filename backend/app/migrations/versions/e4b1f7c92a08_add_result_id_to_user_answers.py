"""add result_id to user_answers

Revision ID: e4b1f7c92a08
Revises: d2e8f4a9b1c3
Create Date: 2026-05-18 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e4b1f7c92a08"
down_revision: Union[str, Sequence[str], None] = "d2e8f4a9b1c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_answers",
        sa.Column("result_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_user_answers_result_id_results",
        "user_answers",
        "results",
        ["result_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_user_answers_result_id",
        "user_answers",
        ["result_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_answers_result_id", table_name="user_answers")
    op.drop_constraint(
        "fk_user_answers_result_id_results",
        "user_answers",
        type_="foreignkey",
    )
    op.drop_column("user_answers", "result_id")
