from app.ai.embeddings.base import EmbeddingProvider


class EmbeddingService:

    def __init__(self, provider: EmbeddingProvider):
        self.provider = provider

    def embed(self, text: str) -> list[float]:
        return self.provider.embed(text)