
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.embeddings.local import LocalEmbeddingProvider
from app.ai.embeddings.service import EmbeddingService
from app.ai.services.semantic_search_service import SemanticSearchService
from app.db.session import get_db
from app.schemas.common import APIResponse
from app.schemas.product_search import (
    ProductSearchItem,
    ProductSearchRequest,
    ProductSearchResponse,
)
from functools import lru_cache

from app.ai.gateway.gemini import GeminiProvider
from app.ai.services.llm_service import LLMService
from app.ai.services.rag_service import RAGService
from app.schemas.product_search import ProductAskRequest
router = APIRouter()

# Reuse the same model instance instead of loading it for every request.
_embedding_service = EmbeddingService(LocalEmbeddingProvider())
_search_service = SemanticSearchService(_embedding_service)

 ## Add this immediately below _search_service
@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:
    return RAGService(
        search_service=_search_service,
        llm_service=LLMService(GeminiProvider()),
    )
@router.post("/search")
def search_products(
    request: ProductSearchRequest,
    db: Session = Depends(get_db),
):
    try:
        results = _search_service.search(
            db=db,
            query=request.query,
            limit=request.limit,
        )

        response = ProductSearchResponse(
            query=request.query.strip(),
            total=len(results),
            products=[
                ProductSearchItem(
                    product_id=product.product_id,
                    product_name=product.product_name,
                    cosine_distance=distance,
                )
                for product, distance in results
            ],
        )

        return APIResponse(data=response.model_dump())

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

# 1. Existing search endpoint


# 2. New RAG endpoint — file ke end mein
@router.post("/ask")
def ask_shopping_assistant(
    request: ProductAskRequest,
    db: Session = Depends(get_db),
):
    try:
        rag_service = get_rag_service()

        result = rag_service.ask(
            db=db,
            question=request.query,
            limit=request.limit,
        )

        return APIResponse(data=result)

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        import logging
        logging.getLogger(__name__).exception(
            "VisionCart RAG request failed"
        )
        raise HTTPException(
            status_code=502,
            detail="Shopping assistant is temporarily unavailable.",
        ) from exc