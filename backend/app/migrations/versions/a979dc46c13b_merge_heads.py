"""merge heads

Revision ID: a979dc46c13b
Revises: b5f3a1b6c8d2, c1f7b9a2d4e8
Create Date: 2026-05-12 10:33:54.971650

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = 'a979dc46c13b'
down_revision: Union[str, Sequence[str], None] = ('b5f3a1b6c8d2', 'c1f7b9a2d4e8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
