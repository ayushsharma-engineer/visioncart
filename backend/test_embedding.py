from app.ai.embeddings.local import LocalEmbeddingProvider
from app.ai.embeddings.service import EmbeddingService


provider = LocalEmbeddingProvider()
embedding_service = EmbeddingService(provider)

text = """
Premium cotton summer shirt.
100% cotton, lightweight, black color,
comfortable for summer and everyday wear.
"""

vector = embedding_service.embed(text)

print("Vector dimensions:", len(vector))
print("First 10 values:", vector[:10])