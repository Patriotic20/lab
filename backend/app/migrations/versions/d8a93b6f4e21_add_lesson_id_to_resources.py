"""add lesson_id to resources

Revision ID: d8a93b6f4e21
Revises: c4f1e2a8b3d7
Create Date: 2026-04-30 09:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8a93b6f4e21'
down_revision: Union[str, Sequence[str], None] = 'c4f1e2a8b3d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('resources', sa.Column('lesson_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_resources_lesson_id'), 'resources', ['lesson_id'], unique=False)
    op.create_foreign_key(
        'fk_resources_lesson_id_lessons',
        'resources',
        'lessons',
        ['lesson_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_resources_lesson_id_lessons', 'resources', type_='foreignkey')
    op.drop_index(op.f('ix_resources_lesson_id'), table_name='resources')
    op.drop_column('resources', 'lesson_id')
