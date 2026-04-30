"""merge_heads

Revision ID: 36aa5e908c9e
Revises: 16e559917160, a783cd0bdddd, 3ca41e559d6f, 0f1f0c528369, e6c5d2a8f0b3
Create Date: 2026-04-30 11:30:00.000000

"""
from typing import Sequence, Union

revision: str = "36aa5e908c9e"
down_revision: Union[str, Sequence[str], None] = (
    "16e559917160",
    "a783cd0bdddd",
    "3ca41e559d6f",
    "0f1f0c528369",
    "e6c5d2a8f0b3",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
