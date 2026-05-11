"""add syllabuses table

Revision ID: b3d5e9f6a2c7
Revises: b2c9d7e8a3b4
Create Date: 2026-05-11 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "b3d5e9f6a2c7"
down_revision: Union[str, Sequence[str], None] = "b2c9d7e8a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "syllabuses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sinf_id", sa.Integer(), nullable=False),
        sa.Column("goals", sa.Text(), nullable=True),
        sa.Column("learning_outcomes", sa.Text(), nullable=True),
        sa.Column("prerequisites", sa.Text(), nullable=True),
        sa.Column("methodical_recommendations", sa.Text(), nullable=True),
        sa.Column("literature", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("grading_scheme", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("competencies", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("file_url", sa.String(length=500), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["sinf_id"], ["sinfs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sinf_id", name="uq_syllabus_sinf"),
    )
    op.create_index(op.f("ix_syllabuses_sinf_id"), "syllabuses", ["sinf_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_syllabuses_sinf_id"), table_name="syllabuses")
    op.drop_table("syllabuses")
