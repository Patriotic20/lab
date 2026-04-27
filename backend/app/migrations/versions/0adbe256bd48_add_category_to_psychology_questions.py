"""add category to psychology_questions

Revision ID: 0adbe256bd48
Revises: 7d8f7423dc85
Create Date: 2026-04-27 03:44:43.325292

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0adbe256bd48'
down_revision: Union[str, Sequence[str], None] = '7d8f7423dc85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'psychology_questions',
        sa.Column('category', sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('psychology_questions', 'category')
