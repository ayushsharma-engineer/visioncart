
from pydantic import BaseModel, Field


class ProductSearchItem(BaseModel):
    product_id: str
    product_name: str
    cosine_distance: float


class ProductSearchResponse(BaseModel):
    query: str
    total: int
    products: list[ProductSearchItem]


class ProductSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=50)


class ProductAskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=5, ge=1, le=10)


class ProductAskResponse(BaseModel):
    question: str
    answer: str
    products: list[ProductSearchItem]
