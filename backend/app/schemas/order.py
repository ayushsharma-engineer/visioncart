from pydantic import BaseModel, Field, ConfigDict


class OrderItemRequest(BaseModel):
    product_id: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=1, le=20)
    selected_size: str | None = Field(default=None, max_length=50)
    selected_color: str | None = Field(default=None, max_length=100)


class CreateOrderRequest(BaseModel):
    address_id: int = Field(gt=0)
    items: list[OrderItemRequest] = Field(min_length=1, max_length=50)


class VerifyPaymentRequest(BaseModel):
    order_id: int = Field(gt=0)
    razorpay_order_id: str = Field(min_length=1, max_length=100)
    razorpay_payment_id: str = Field(min_length=1, max_length=100)
    razorpay_signature: str = Field(min_length=1, max_length=256)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    total_amount: float
    currency: str
    status: str
