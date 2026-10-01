from abc import ABC, abstractmethod


class LLMProvider(ABC): ##This creates a base contract for our LLM providers.

    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass