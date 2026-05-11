"""add student_movements table and student enrollment/graduation dates

Revision ID: b5f3a1b6c8d2
Revises: b4a8c2d9e7f5
Create Date: 2026-05-11 13:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b5f3a1b6c8d2"
down_revision: Union[str, Sequence[str], None] = "b4a8c2d9e7f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("enrollment_date", sa.Date(), nullable=True))
    op.add_column("students", sa.Column("graduation_date", sa.Date(), nullable=True))

    op.create_table(
        "student_movements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("movement_type", sa.String(length=20), nullable=False),
        sa.Column("from_group_id", sa.Integer(), nullable=True),
        sa.Column("to_group_id", sa.Integer(), nullable=True),
        sa.Column("from_status", sa.String(length=50), nullable=True),
        sa.Column("to_status", sa.String(length=50), nullable=True),
        sa.Column("order_number", sa.String(length=100), nullable=True),
        sa.Column("order_date", sa.Date(), nullable=True),
        sa.Column("effective_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["from_group_id"], ["groups.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["to_group_id"], ["groups.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_student_movements_student_id"), "student_movements", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_student_movements_student_id"), table_name="student_movements")
    op.drop_table("student_movements")
    op.drop_column("students", "graduation_date")
    op.drop_column("students", "enrollment_date")
