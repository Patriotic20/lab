"""add topic_id to resources

Revision ID: c1f7b9a2d4e8
Revises: b4a8c2d9e7f5
Create Date: 2026-05-12 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c1f7b9a2d4e8"
down_revision: Union[str, Sequence[str], None] = "b4a8c2d9e7f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "resources",
        sa.Column("topic_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_resources_topic_id_course_topics",
        "resources",
        "course_topics",
        ["topic_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_resources_topic_id"), "resources", ["topic_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_resources_topic_id"), table_name="resources")
    op.drop_constraint("fk_resources_topic_id_course_topics", "resources", type_="foreignkey")
    op.drop_column("resources", "topic_id")
