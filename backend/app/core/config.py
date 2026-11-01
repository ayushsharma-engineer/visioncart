
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

    def validate(self):
        if not self.DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not configured")

        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise RuntimeError(
                "SECRET_KEY must be configured with a strong secret "
                "of at least 32 characters"
            )
        if not self.RAZORPAY_KEY_ID or not self.RAZORPAY_KEY_SECRET:
            raise RuntimeError("Razorpay credentials are not configured")


settings = Settings()
settings.validate()