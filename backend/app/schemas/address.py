from pydantic import BaseModel, Field, ConfigDict


class AddressCreate(BaseModel):
    label: str = Field(default="Home", max_length=30)
    recipient_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    address_line1: str = Field(min_length=1, max_length=255)
    address_line2: str | None = None
    landmark: str | None = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    latitude: float | None = None
    longitude: float | None = None
    is_default: bool = False


class AddressUpdate(AddressCreate):
    pass


class AddressResponse(AddressCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
