"""add assignments and assignment_submissions tables

Revision ID: b4a8c2d9e7f5
Revises: b3d5e9f6a2c7
Create Date: 2026-05-11 12:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "b4a8c2d9e7f5"
down_revision: Union[str, Sequence[str], None] = "b3d5e9f6a2c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sinf_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=True),
        sa.Column("lesson_id", sa.Integer(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("deadline", sa.DateTime(), nullable=False),
        sa.Column("max_grade", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("allow_file", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("allow_text", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("allowed_file_types", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["sinf_id"], ["sinfs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_id"], ["course_topics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assignments_sinf_id"), "assignments", ["sinf_id"], unique=False)
    op.create_index(op.f("ix_assignments_topic_id"), "assignments", ["topic_id"], unique=False)
    op.create_index(op.f("ix_assignments_lesson_id"), "assignments", ["lesson_id"], unique=False)

    op.create_table(
        "assignment_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("submitted_text", sa.Text(), nullable=True),
        sa.Column("submitted_files", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("grade", sa.Integer(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("graded_by_user_id", sa.Integer(), nullable=True),
        sa.Column("graded_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["assignments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["graded_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", "user_id", name="uq_submission_per_user"),
    )
    op.create_index(
        op.f("ix_assignment_submissions_assignment_id"),
        "assignment_submissions",
        ["assignment_id"],
        unique=False,
    )
    op.create_index(op.f("ix_assignment_submissions_user_id"), "assignment_submissions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_assignment_submissions_user_id"), table_name="assignment_submissions")
    op.drop_index(op.f("ix_assignment_submissions_assignment_id"), table_name="assignment_submissions")
    op.drop_table("assignment_submissions")

    op.drop_index(op.f("ix_assignments_lesson_id"), table_name="assignments")
    op.drop_index(op.f("ix_assignments_topic_id"), table_name="assignments")
    op.drop_index(op.f("ix_assignments_sinf_id"), table_name="assignments")
    op.drop_table("assignments")
