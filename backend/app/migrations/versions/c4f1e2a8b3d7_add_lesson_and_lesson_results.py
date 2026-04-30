"""add lesson and lesson_results tables

Revision ID: c4f1e2a8b3d7
Revises: 8b91714a27ed
Create Date: 2026-04-30 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4f1e2a8b3d7'
down_revision: Union[str, Sequence[str], None] = '8b91714a27ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'lessons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject_teacher_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('topic', sa.String(length=255), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_teacher_id'], ['subject_teachers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_lessons_group_id'), 'lessons', ['group_id'], unique=False)
    op.create_index(op.f('ix_lessons_subject_teacher_id'), 'lessons', ['subject_teacher_id'], unique=False)

    op.create_table(
        'lesson_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('attendance', sa.String(length=16), nullable=False),
        sa.Column('grade', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lesson_id', 'user_id', name='uq_lesson_result_per_user'),
    )
    op.create_index(op.f('ix_lesson_results_lesson_id'), 'lesson_results', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_lesson_results_user_id'), 'lesson_results', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_lesson_results_user_id'), table_name='lesson_results')
    op.drop_index(op.f('ix_lesson_results_lesson_id'), table_name='lesson_results')
    op.drop_table('lesson_results')
    op.drop_index(op.f('ix_lessons_subject_teacher_id'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_group_id'), table_name='lessons')
    op.drop_table('lessons')
