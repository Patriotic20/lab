"""add academic year, semester, sinf year/semester fields and lesson type

Revision ID: b1e8c4d52f01
Revises: a4e5d2f1c8b9
Create Date: 2026-05-11 11:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1e8c4d52f01"
down_revision: Union[str, Sequence[str], None] = "a4e5d2f1c8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "academic_years",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_academic_years_name"),
    )

    op.create_table(
        "semesters",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("academic_year_id", sa.Integer(), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["academic_year_id"], ["academic_years.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("academic_year_id", "number", name="uq_semester_year_number"),
    )
    op.create_index(op.f("ix_semesters_academic_year_id"), "semesters", ["academic_year_id"], unique=False)

    op.add_column("sinfs", sa.Column("academic_year_id", sa.Integer(), nullable=True))
    op.add_column("sinfs", sa.Column("semester_number", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_sinfs_academic_year_id"), "sinfs", ["academic_year_id"], unique=False)
    op.create_foreign_key(
        "fk_sinfs_academic_year_id",
        "sinfs",
        "academic_years",
        ["academic_year_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("lessons", sa.Column("lesson_type", sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("lessons", "lesson_type")

    op.drop_constraint("fk_sinfs_academic_year_id", "sinfs", type_="foreignkey")
    op.drop_index(op.f("ix_sinfs_academic_year_id"), table_name="sinfs")
    op.drop_column("sinfs", "semester_number")
    op.drop_column("sinfs", "academic_year_id")

    op.drop_index(op.f("ix_semesters_academic_year_id"), table_name="semesters")
    op.drop_table("semesters")
    op.drop_table("academic_years")
