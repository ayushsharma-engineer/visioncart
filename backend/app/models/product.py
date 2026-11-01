from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    JSON,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)

    product_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    sku: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True)
    subcategory: Mapped[str] = mapped_column(String(100), index=True)

    description: Mapped[str] = mapped_column(Text, nullable=False)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)

    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    image_url: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    colors: Mapped[list] = mapped_column(JSON, default=list)
    available_sizes: Mapped[list] = mapped_column(JSON, default=list)
    material: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occasions: Mapped[list] = mapped_column(JSON, default=list)

    is_demo: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )