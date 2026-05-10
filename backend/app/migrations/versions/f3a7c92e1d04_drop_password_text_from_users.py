"""drop password_text from users

Revision ID: f3a7c92e1d04
Revises: ab605885e835
Create Date: 2026-05-10 14:00:00.000000

Reason: The `password_text` column stored plaintext user passwords alongside
the bcrypt hash, which is a critical security flaw. Removing the column and
all backfill logic. Authentication continues to work via the hashed `password`
column only.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3a7c92e1d04"
down_revision: Union[str, Sequence[str], None] = "ab605885e835"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("users", "password_text")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "users",
        sa.Column("password_text", sa.String(length=255), nullable=True),
    )
