from app.ai.gateway.gemini import GeminiProvider
from app.ai.services.llm_service import LLMService
from app.ai.schemas.product import ProductIntelligence
from app.ai.prompts.product import PRODUCT_INTELLIGENCE_PROMPT


provider = GeminiProvider()
llm = LLMService(provider)

product_data = """
Name: Premium Cotton Summer Shirt
Category: Clothing
Subcategory: Shirt
Brand: Example Brand
Price: ₹1499
Description: Lightweight 100% cotton shirt designed for everyday summer wear.
Color: Black
Sizes: S, M, L, XL
"""

prompt = PRODUCT_INTELLIGENCE_PROMPT.format(
    product_data=product_data
)

product = llm.generate_structured(
    prompt,
    ProductIntelligence
)

print(product)
print(product.model_dump())