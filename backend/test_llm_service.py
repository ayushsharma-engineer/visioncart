from app.ai.gateway.gemini import GeminiProvider
from app.ai.services.llm_service import LLMService


provider = GeminiProvider()
llm = LLMService(provider)

response = llm.generate(
    "In one sentence, explain why cotton is suitable for summer clothing."
)

print(response)