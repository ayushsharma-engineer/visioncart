from app.ai.gateway.gemini import GeminiProvider


llm = GeminiProvider()

response = llm.generate(
    "In one sentence, explain why cotton is suitable for summer clothing."
)

print(response)