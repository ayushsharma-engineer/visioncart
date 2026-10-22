
from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from app.db.base import Base


class ProductEmbedding(Base):
    __tablename__ = "product_embeddings"

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            name="uq_product_embeddings_product_id",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    product_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    knowledge_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    embedding: Mapped[list[float]] = mapped_column(
        Vector(384),
        nullable=False,
    )
