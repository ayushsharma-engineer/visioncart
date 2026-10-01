from app.ai.gateway.base import LLMProvider


class LLMService:

    def __init__(self, provider: LLMProvider):
        self.provider = provider

    def generate(self, prompt: str) -> str:
        return self.provider.generate(prompt)

    def generate_structured(self, prompt: str, response_schema):
        return self.provider.generate_structured(
            prompt,
            response_schema
        )