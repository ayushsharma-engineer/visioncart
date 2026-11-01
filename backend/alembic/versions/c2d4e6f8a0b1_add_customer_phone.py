"""Add nullable phone number to users.

Revision ID: c2d4e6f8a0b1
Revises: b1af2057007d
"""
from alembic import op
import sqlalchemy as sa

revision = "c2d4e6f8a0b1"
down_revision = "b1af2057007d"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=20), nullable=True))

def downgrade() -> None:
    op.drop_column("users", "phone")
