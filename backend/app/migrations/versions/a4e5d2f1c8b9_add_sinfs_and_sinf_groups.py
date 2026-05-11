"""add sinfs and sinf_groups tables

Revision ID: a4e5d2f1c8b9
Revises: f3a7c92e1d04
Create Date: 2026-05-11 09:45:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a4e5d2f1c8b9"
down_revision: Union[str, Sequence[str], None] = "f3a7c92e1d04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "sinfs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("teacher_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["teacher_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sinfs_subject_id"), "sinfs", ["subject_id"], unique=False)
    op.create_index(op.f("ix_sinfs_teacher_id"), "sinfs", ["teacher_id"], unique=False)

    op.create_table(
        "sinf_groups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sinf_id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sinf_id"], ["sinfs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sinf_id", "group_id", name="uq_sinf_group"),
    )
    op.create_index(op.f("ix_sinf_groups_group_id"), "sinf_groups", ["group_id"], unique=False)
    op.create_index(op.f("ix_sinf_groups_sinf_id"), "sinf_groups", ["sinf_id"], unique=False)

    op.add_column("lessons", sa.Column("sinf_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_lessons_sinf_id"), "lessons", ["sinf_id"], unique=False)
    op.create_foreign_key(
        "fk_lessons_sinf_id",
        "lessons",
        "sinfs",
        ["sinf_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("resources", sa.Column("sinf_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_resources_sinf_id"), "resources", ["sinf_id"], unique=False)
    op.create_foreign_key(
        "fk_resources_sinf_id",
        "resources",
        "sinfs",
        ["sinf_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_resources_sinf_id", "resources", type_="foreignkey")
    op.drop_index(op.f("ix_resources_sinf_id"), table_name="resources")
    op.drop_column("resources", "sinf_id")

    op.drop_constraint("fk_lessons_sinf_id", "lessons", type_="foreignkey")
    op.drop_index(op.f("ix_lessons_sinf_id"), table_name="lessons")
    op.drop_column("lessons", "sinf_id")

    op.drop_index(op.f("ix_sinf_groups_sinf_id"), table_name="sinf_groups")
    op.drop_index(op.f("ix_sinf_groups_group_id"), table_name="sinf_groups")
    op.drop_table("sinf_groups")

    op.drop_index(op.f("ix_sinfs_teacher_id"), table_name="sinfs")
    op.drop_index(op.f("ix_sinfs_subject_id"), table_name="sinfs")
    op.drop_table("sinfs")
