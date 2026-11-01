
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
from sqlalchemy import or_
from app.models.product import Product
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
            language=getattr(request, "language", "auto"),
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
        

@router.get("/")
def get_products(
    category: str | None = None,
    search: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    if page < 1:
        raise HTTPException(status_code=422, detail="page must be >= 1")

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=422,
            detail="page_size must be between 1 and 100",
        )

    if min_price is not None and min_price < 0:
        raise HTTPException(status_code=422, detail="min_price cannot be negative")

    if max_price is not None and max_price < 0:
        raise HTTPException(status_code=422, detail="max_price cannot be negative")

    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=422,
            detail="min_price cannot exceed max_price",
        )

    query = db.query(Product).filter(Product.is_active.is_(True))

    if category:
        query = query.filter(Product.category.ilike(category.strip()))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
                Product.brand.ilike(term),
                Product.subcategory.ilike(term),
            )
        )

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    total = query.count()
    products = (
        query.order_by(Product.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return APIResponse(
        data={
            "items": [
                {
                    "product_id": product.product_id,
                    "sku": product.sku,
                    "name": product.name,
                    "category": product.category,
                    "subcategory": product.subcategory,
                    "description": product.description,
                    "brand": product.brand,
                    "price": float(product.price),
                    "image_url": product.image_url,
                    "colors": product.colors or [],
                    "available_sizes": product.available_sizes or [],
                    "material": product.material,
                    "occasions": product.occasions or [],
                }
                for product in products
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }
    )


@router.get("/{product_id}")
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(
            Product.product_id == product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return APIResponse(
        data={
            "product_id": product.product_id,
            "sku": product.sku,
            "name": product.name,
            "category": product.category,
            "subcategory": product.subcategory,
            "description": product.description,
            "brand": product.brand,
            "price": float(product.price),
            "image_url": product.image_url,
            "colors": product.colors or [],
            "available_sizes": product.available_sizes or [],
            "material": product.material,
            "occasions": product.occasions or [],
        }
    )
