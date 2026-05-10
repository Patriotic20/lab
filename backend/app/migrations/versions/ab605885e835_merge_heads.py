"""merge_heads

Revision ID: ab605885e835
Revises: 3ca41e559d6f, e6c5d2a8f0b3
Create Date: 2026-04-30 11:40:00.000000

"""

from typing import Sequence, Union

revision: str = "ab605885e835"
down_revision: Union[str, Sequence[str], None] = ("3ca41e559d6f", "e6c5d2a8f0b3")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
