from sentence_transformers import SentenceTransformer

from app.ai.embeddings.base import EmbeddingProvider


class LocalEmbeddingProvider(EmbeddingProvider):

    def __init__(self):
        self.model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )

    def embed(self, text: str) -> list[float]:
        embedding = self.model.encode(text)
        return embedding.tolist()        