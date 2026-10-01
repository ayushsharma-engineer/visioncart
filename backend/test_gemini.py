from google import genai
from app.core.config import settings

client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)

response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents="Explain in one sentence why cotton is suitable for summer clothing."
)

print(response.text)