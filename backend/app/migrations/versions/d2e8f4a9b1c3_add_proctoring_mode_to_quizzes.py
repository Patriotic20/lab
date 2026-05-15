"""add proctoring_mode to quizzes

Revision ID: d2e8f4a9b1c3
Revises: a979dc46c13b
Create Date: 2026-05-15 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d2e8f4a9b1c3"
down_revision: Union[str, Sequence[str], None] = "a979dc46c13b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "quizzes",
        sa.Column(
            "proctoring_mode",
            sa.String(),
            nullable=False,
            server_default="standard",
        ),
    )


def downgrade() -> None:
    op.drop_column("quizzes", "proctoring_mode")
