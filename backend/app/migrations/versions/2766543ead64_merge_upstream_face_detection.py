"""merge_upstream_face_detection

Revision ID: 2766543ead64
Revises: 0f1f0c528369, 16e559917160, a783cd0bdddd
Create Date: 2026-04-13 10:01:18.943695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2766543ead64'
down_revision: Union[str, Sequence[str], None] = ('0f1f0c528369', '16e559917160', 'a783cd0bdddd')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
