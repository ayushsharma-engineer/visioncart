
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.embeddings.service import EmbeddingService
from app.models.product_embedding import ProductEmbedding


class SemanticSearchService:
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service

    def search(
        self,
        db: Session,
        query: str,
        limit: int = 10,
    ) -> list[tuple[ProductEmbedding, float]]:
        query = query.strip()

        if not query:
            raise ValueError("Search query must not be empty")

        if not 1 <= limit <= 50:
            raise ValueError("limit must be between 1 and 50")

        query_embedding = self.embedding_service.embed(query)

        if len(query_embedding) != 384:
            raise ValueError(
                f"Expected 384 dimensions, got {len(query_embedding)}"
            )

        distance = ProductEmbedding.embedding.cosine_distance(
            query_embedding
        )

        statement = (
            select(ProductEmbedding, distance.label("cosine_distance"))
            .order_by(distance.asc())
            .limit(limit)
        )

        results = db.execute(statement).all()

        return [
            (product, float(cosine_distance))
            for product, cosine_distance in results
        ]
