from app.ai.schemas.product import ProductIntelligence
from app.ai.services.okf_service import product_to_okf


product = ProductIntelligence(
    name="Premium Cotton Summer Shirt",
    category="Clothing",
    subcategory="Shirt",
    brand="Example Brand",
    price=1499,
    description="Lightweight 100% cotton shirt for summer.",
    material="Cotton",
    composition="100% cotton",
    thickness="Lightweight",
    available_sizes=["S", "M", "L", "XL"],
    suitable_weather=["Hot"],
    suitable_seasons=["Summer"],
    occasions=["Casual"],
    colors=["Black"],
    comfort_level="High",
    weight="Light",
)

okf = product_to_okf(product)

print(okf)