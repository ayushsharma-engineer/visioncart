from google import genai

from app.ai.gateway.base import LLMProvider
from app.core.config import settings


class GeminiProvider(LLMProvider):

    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        return response.text

    def generate_structured(self, prompt: str, response_schema):
        response = self.client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": response_schema, # "Don't give me arbitrary text. Structure your response according to the schema I provide."
            },
        )

        return response.parsed