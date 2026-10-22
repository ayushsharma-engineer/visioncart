
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.ai.embeddings.service import EmbeddingService
from app.ai.services.okf_service import product_to_okf
from app.ai.schemas.product import ProductIntelligence
from app.models.product_embedding import ProductEmbedding


class ProductEmbeddingService:
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service

    def save_product(
        self,
        db: Session,
        product_id: str,
        product: ProductIntelligence,
    ) -> ProductEmbedding:
        if not product_id or not product_id.strip():
            raise ValueError("product_id must not be empty")

        product_id = product_id.strip()
        knowledge_text = product_to_okf(product)
        embedding = self.embedding_service.embed(knowledge_text)

        if len(embedding) != 384:
            raise ValueError(
                f"Expected 384 dimensions, got {len(embedding)}"
            )

        statement = insert(ProductEmbedding).values(
            product_id=product_id,
            product_name=product.name,
            knowledge_text=knowledge_text,
            embedding=embedding,
        )

        statement = statement.on_conflict_do_update(
            constraint="uq_product_embeddings_product_id",
            set_={
                "product_name": statement.excluded.product_name,
                "knowledge_text": statement.excluded.knowledge_text,
                "embedding": statement.excluded.embedding,
            },
        ).returning(ProductEmbedding)

        try:
            record = db.execute(statement).scalar_one()
            db.commit()
            db.refresh(record)
            return record
        except Exception:
            db.rollback()
            raise
