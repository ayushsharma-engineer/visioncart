from app.ai.schemas.product import ProductIntelligence
from app.ai.schemas.product import ProductIntelligence

def product_to_okf(product: ProductIntelligence) -> str:
    return f"""---
type: Product
name: {product.name}
category: {product.category}
subcategory: {product.subcategory or ""}
brand: {product.brand or ""}
price: {product.price}
---

Description: {product.description or ""}

Material: {product.material or ""}
Composition: {product.composition or ""}
Thickness: {product.thickness or ""}
Breathability: {product.breathability or ""}
Stretch: {product.stretch or ""}
Softness: {product.softness or ""}
Texture: {product.texture or ""}

Fit: {product.fit or ""}
Available Sizes: {", ".join(product.available_sizes)}

Weather: {", ".join(product.suitable_weather)}
Seasons: {", ".join(product.suitable_seasons)}

Occasions: {", ".join(product.occasions)}
Styles: {", ".join(product.styles)}
Formality: {product.formality or ""}

Colors: {", ".join(product.colors)}
Patterns: {", ".join(product.patterns)}

Comfort: {product.comfort_level or ""}
Weight: {product.weight or ""}
Transparency: {product.transparency or ""}

Quality: {product.quality_level or ""}
Durability: {product.durability or ""}

Care: {product.care_instructions or ""}

Review Summary: {product.review_summary or ""}

Evidence:
{chr(10).join("- " + e for e in product.evidence)}
"""