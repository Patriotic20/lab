"""add_diagnosis_to_psychology_results

Revision ID: 2879fe432190
Revises: 447429ca2202
Create Date: 2026-04-19 20:16:42.415284

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '2879fe432190'
down_revision: Union[str, Sequence[str], None] = '447429ca2202'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'psychology_results',
        sa.Column('diagnosis', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('psychology_results', 'diagnosis')
