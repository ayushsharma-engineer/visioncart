from pydantic import BaseModel, Field
# from typing import Any


class ShoppingIntent(BaseModel):
    intent_type: str

    category: str | None = None
    subcategory: str | None = None

    budget_min: float | None = None
    budget_max: float | None = None

    gender: str | None = None
    size: str | None = None
    color: str | None = None
    brand: str | None = None

    occasion: str | None = None
    season: str | None = None
    weather: str | None = None
    style: str | None = None

    material: str | None = None
    fit: str | None = None

    constraints: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)

    #entities: dict[str, Any] = Field(default_factory=dict)
    constraints: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)