
from sqlalchemy import func, select

from app.ai.embeddings.local import LocalEmbeddingProvider
from app.ai.embeddings.service import EmbeddingService
from app.ai.schemas.product import ProductIntelligence
from app.ai.services.product_embedding_service import ProductEmbeddingService
from app.db.session import SessionLocal
from app.models.product_embedding import ProductEmbedding


PRODUCT_ID = "VC-TEST-001"


def build_product(name: str) -> ProductIntelligence:
    return ProductIntelligence(
        name=name,
        category="Clothing",
        subcategory="Casual Shirt",
        brand="Example Brand",
        description="Lightweight cotton shirt suitable for summer.",
        price=1499.0,
        material="Cotton",
        composition="100% cotton",
        suitable_seasons=["Summer"],
        suitable_weather=["Hot"],
        available_sizes=["M", "L", "XL"],
        colors=["Black"],
        evidence=[
            "Product description states lightweight cotton fabric.",
            "Product description states summer suitability.",
        ],
    )


def main():
    embedding_service = EmbeddingService(LocalEmbeddingProvider())
    product_service = ProductEmbeddingService(embedding_service)

    with SessionLocal() as db:
        first = product_service.save_product(
            db,
            PRODUCT_ID,
            build_product("Premium Cotton Summer Shirt"),
        )
        first_id = first.id

        second = product_service.save_product(
            db,
            PRODUCT_ID,
            build_product("Premium Cotton Summer Shirt Updated"),
        )

        count = db.scalar(
            select(func.count())
            .select_from(ProductEmbedding)
            .where(ProductEmbedding.product_id == PRODUCT_ID)
        )

        assert second.id == first_id, "Record ID changed during upsert"
        assert count == 1, f"Expected one record, found {count}"
        assert second.product_name == "Premium Cotton Summer Shirt Updated"
        assert len(second.embedding) == 384

        print("PASS: Product inserted.")
        print("PASS: Existing product updated.")
        print("PASS: No duplicate records.")
        print("PASS: Embedding dimensions = 384.")
        print(f"Record ID: {second.id}")
        print(f"Product ID: {second.product_id}")
        print("Product remains in the database.")


if __name__ == "__main__":
    main()
