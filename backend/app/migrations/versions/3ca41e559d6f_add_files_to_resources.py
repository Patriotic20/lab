"""add_files_to_resources

Revision ID: 3ca41e559d6f
Revises: fa3e6b6cbce7
Create Date: 2026-04-30 11:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "3ca41e559d6f"
down_revision: Union[str, Sequence[str], None] = "fa3e6b6cbce7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "resources",
        sa.Column(
            "files",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("resources", "files")
