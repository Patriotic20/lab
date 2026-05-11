"""add course_modules, course_topics tables and lessons.topic_id

Revision ID: b2c9d7e8a3b4
Revises: b1e8c4d52f01
Create Date: 2026-05-11 11:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c9d7e8a3b4"
down_revision: Union[str, Sequence[str], None] = "b1e8c4d52f01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "course_modules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sinf_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["sinf_id"], ["sinfs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_modules_sinf_id"), "course_modules", ["sinf_id"], unique=False)

    op.create_table(
        "course_topics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("module_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hours", sa.Integer(), nullable=True),
        sa.Column("learning_outcomes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["course_modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_topics_module_id"), "course_topics", ["module_id"], unique=False)

    op.add_column("lessons", sa.Column("topic_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_lessons_topic_id"), "lessons", ["topic_id"], unique=False)
    op.create_foreign_key(
        "fk_lessons_topic_id",
        "lessons",
        "course_topics",
        ["topic_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_lessons_topic_id", "lessons", type_="foreignkey")
    op.drop_index(op.f("ix_lessons_topic_id"), table_name="lessons")
    op.drop_column("lessons", "topic_id")

    op.drop_index(op.f("ix_course_topics_module_id"), table_name="course_topics")
    op.drop_table("course_topics")
    op.drop_index(op.f("ix_course_modules_sinf_id"), table_name="course_modules")
    op.drop_table("course_modules")
