import os

os.environ["DATABASE_URL"] = "sqlite:///./test-email-auth.db"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-thirty-two-characters-long"
