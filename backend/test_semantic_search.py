
from sqlalchemy import func, select

from app.ai.embeddings.local import LocalEmbeddingProvider
from app.ai.embeddings.service import EmbeddingService
from app.ai.schemas.product import ProductIntelligence
from app.ai.services.product_embedding_service import ProductEmbeddingService
from app.ai.services.semantic_search_service import SemanticSearchService
from app.db.session import SessionLocal
from app.models.product_embedding import ProductEmbedding


PRODUCT_ID = "VC-SEARCH-TEST-001"


def main():
    embedding_service = EmbeddingService(LocalEmbeddingProvider())
    product_service = ProductEmbeddingService(embedding_service)
    search_service = SemanticSearchService(embedding_service)

    product = ProductIntelligence(
        name="Premium Cotton Summer Shirt",
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

    try:
        with SessionLocal() as db:
            product_service.save_product(db, PRODUCT_ID, product)

            results = search_service.search(
                db,
                "comfortable cotton shirt for hot summer weather",
                limit=5,
            )

            count = db.scalar(
                select(func.count())
                .select_from(ProductEmbedding)
                .where(ProductEmbedding.product_id == PRODUCT_ID)
            )

            assert count == 1, f"Expected one test record, found {count}"
            assert results, "Semantic search returned no products"
            assert any(
                item.product_id == PRODUCT_ID
                for item, _ in results
            ), "Test product was not retrieved"

            print("PASS: Product saved through upsert service.")
            print("PASS: Semantic search returned results.")
            print("PASS: Test product was retrieved.")
            print("\nSearch results:")

            for item, distance in results:
                print(f"Product: {item.product_name}")
                print(f"Product ID: {item.product_id}")
                print(f"Cosine distance: {distance:.4f}")
                print("-" * 40)

    finally:
        with SessionLocal() as db:
            db.execute(
                ProductEmbedding.__table__.delete().where(
                    ProductEmbedding.product_id == PRODUCT_ID
                )
            )
            db.commit()


if __name__ == "__main__":
    main()
