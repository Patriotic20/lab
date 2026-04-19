"""restore_missing_cheating_columns

Revision ID: dfc90e8f944e
Revises: 2766543ead64
Create Date: 2026-04-13 19:52:51.116162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfc90e8f944e'
down_revision: Union[str, Sequence[str], None] = '2766543ead64'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # All changes in this migration were already applied by earlier branches:
    # - yakuniy: b5d0ae85d0c0, hemis_transactions: a783cd0bdddd
    # - cheating columns on results: 0f1f0c528369
    # - FK constraint changes: already in place via prior migrations
    pass


def downgrade() -> None:
    pass
