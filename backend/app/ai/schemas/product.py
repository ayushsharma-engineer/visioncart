from pydantic import BaseModel, Field


class ProductIntelligence(BaseModel):

    # ─────────────────────────────
    # Basic Product Information
    # ─────────────────────────────
    name: str
    category: str
    subcategory: str | None = None
    brand: str | None = None
    description: str | None = None
    price: float

    # ─────────────────────────────
    # Material & Fabric
    # ─────────────────────────────
    material: str | None = None
    composition: str | None = None
    thickness: str | None = None
    breathability: str | None = None
    stretch: str | None = None
    softness: str | None = None
    texture: str | None = None

    # ─────────────────────────────
    # Fit & Size
    # ─────────────────────────────
    fit: str | None = None
    available_sizes: list[str] = Field(default_factory=list)
    size_notes: str | None = None

    # ─────────────────────────────
    # Comfort
    # ─────────────────────────────
    comfort_level: str | None = None
    weight: str | None = None
    transparency: str | None = None
    skin_friendliness: str | None = None

    # ─────────────────────────────
    # Weather & Season
    # ─────────────────────────────
    suitable_weather: list[str] = Field(default_factory=list)
    suitable_seasons: list[str] = Field(default_factory=list)
    temperature_range: str | None = None

    # ─────────────────────────────
    # Occasion & Style
    # ─────────────────────────────
    occasions: list[str] = Field(default_factory=list)
    styles: list[str] = Field(default_factory=list)
    formality: str | None = None

    # ─────────────────────────────
    # Appearance
    # ─────────────────────────────
    colors: list[str] = Field(default_factory=list)
    patterns: list[str] = Field(default_factory=list)
    design_details: list[str] = Field(default_factory=list)

    # ─────────────────────────────
    # Quality & Durability
    # ─────────────────────────────
    quality_level: str | None = None
    durability: str | None = None
    color_fastness: str | None = None
    pilling_resistance: str | None = None

    # ─────────────────────────────
    # Care & Maintenance
    # ─────────────────────────────
    care_instructions: str | None = None
    wash_type: str | None = None
    ironing_required: bool | None = None

    # ─────────────────────────────
    # Compatibility
    # ─────────────────────────────
    compatible_styles: list[str] = Field(default_factory=list)
    compatible_categories: list[str] = Field(default_factory=list)
    outfit_roles: list[str] = Field(default_factory=list)

    # ─────────────────────────────
    # Value
    # ─────────────────────────────
    value_assessment: str | None = None
    price_segment: str | None = None

    # ─────────────────────────────
    # Review Intelligence
    # ─────────────────────────────
    review_summary: str | None = None
    review_sentiment: str | None = None
    common_positive_points: list[str] = Field(default_factory=list)
    common_negative_points: list[str] = Field(default_factory=list)

    # ─────────────────────────────
    # AI Evidence & Confidence
    # ─────────────────────────────
    evidence: list[str] = Field(default_factory=list)
    confidence_score: float | None = None