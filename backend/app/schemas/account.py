import re
from pydantic import BaseModel, Field, model_validator


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, min_length=10, max_length=13)

    @model_validator(mode="after")
    def validate_fields(self):
        if self.name is None and self.phone is None:
            raise ValueError("At least one profile field is required")
        if self.phone is not None and not re.fullmatch(r"(?:\+91)?[6-9]\d{9}", self.phone.strip()):
            raise ValueError("Enter a valid 10-digit Indian mobile number, optionally with +91")
        return self


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
