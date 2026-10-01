from app.ai.gateway.gemini import GeminiProvider
from app.ai.services.llm_service import LLMService
from app.ai.schemas.intent import ShoppingIntent
from app.ai.prompts.intent import INTENT_EXTRACTION_PROMPT


provider = GeminiProvider()
llm = LLMService(provider)

query = "Find a black shirt in XL"

prompt = INTENT_EXTRACTION_PROMPT.format(query=query)

intent = llm.generate_structured(
    prompt,
    ShoppingIntent
)

print(intent)
print(intent.model_dump())