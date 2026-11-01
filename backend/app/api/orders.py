import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.address import Address
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.schemas.common import APIResponse
from app.schemas.order import CreateOrderRequest, VerifyPaymentRequest

router = APIRouter()
logger = logging.getLogger(__name__)


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def money(value):
    return Decimal(str(value)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


@router.post("/create")
def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")

    address = db.query(Address).filter(
        Address.id == request.address_id,
        Address.user_id == current_user.id,
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Delivery address not found")

    requested_ids = [item.product_id for item in request.items]

    if len(requested_ids) != len(set(requested_ids)):
        raise HTTPException(
            status_code=422,
            detail="Duplicate products must be combined into one cart item",
        )

    products = db.query(Product).filter(
        Product.product_id.in_(requested_ids),
        Product.is_active.is_(True),
    ).all()

    product_map = {product.product_id: product for product in products}

    if len(product_map) != len(requested_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more products are unavailable",
        )

    subtotal = Decimal("0.00")
    order_items = []

    for requested in request.items:
        product = product_map[requested.product_id]

        if requested.selected_size:
            available_sizes = product.available_sizes or []
            if available_sizes and requested.selected_size not in available_sizes:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid size for {product.name}",
                )

        if requested.selected_color:
            available_colors = product.colors or []
            if available_colors and requested.selected_color not in available_colors:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid color for {product.name}",
                )

        unit_price = money(product.price)

        if unit_price <= 0:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid price for {product.name}",
            )

        line_total = money(unit_price * requested.quantity)
        subtotal += line_total

        order_items.append({
            "product_id": product.product_id,
            "product_name": product.name,
            "sku": product.sku,
            "image_url": product.image_url,
            "quantity": requested.quantity,
            "selected_size": requested.selected_size,
            "selected_color": requested.selected_color,
            "unit_price": unit_price,
            "line_total": line_total,
        })

    subtotal = money(subtotal)
    shipping = Decimal("0.00")
    total = money(subtotal + shipping)
    amount_paise = int(total * 100)

    if amount_paise < 100:
        raise HTTPException(
            status_code=422,
            detail="Order amount must be at least INR 1",
        )

    order_number = f"VC-{uuid.uuid4().hex[:12].upper()}"

    order = Order(
        order_number=order_number,
        user_id=current_user.id,
        address_id=address.id,
        recipient_name=address.recipient_name,
        phone=address.phone,
        address_line1=address.address_line1,
        address_line2=address.address_line2,
        landmark=address.landmark,
        city=address.city,
        state=address.state,
        postal_code=address.postal_code,
        country=address.country,
        subtotal=subtotal,
        shipping_amount=shipping,
        total_amount=total,
        currency="INR",
        status="pending_payment",
    )

    try:
        db.add(order)
        db.flush()

        for item_data in order_items:
            db.add(OrderItem(order_id=order.id, **item_data))

        client = get_razorpay_client()
        razorpay_order = client.order.create(data={
            "amount": amount_paise,
            "currency": "INR",
            "receipt": order_number,
            "notes": {
                "internal_order_id": str(order.id),
                "customer_id": str(current_user.id),
            },
        })

        payment = Payment(
            order_id=order.id,
            provider="razorpay",
            razorpay_order_id=razorpay_order["id"],
            amount_paise=amount_paise,
            currency="INR",
            status="created",
        )

        db.add(payment)
        db.commit()
        db.refresh(order)
        db.refresh(payment)

        return APIResponse(data={
            "order_id": order.id,
            "order_number": order.order_number,
            "amount": amount_paise,
            "currency": "INR",
            "razorpay_order_id": payment.razorpay_order_id,
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "customer": {
                "name": current_user.name,
                "email": current_user.email,
                "phone": current_user.phone or address.phone,
            },
        })

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Razorpay order creation failed")
        raise HTTPException(
            status_code=502,
            detail="Unable to create payment order. Please try again.",
        ) from exc


@router.get("/my")
def list_my_orders(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc(), Order.id.desc()).all()
    data = []
    for order in orders:
        payment = db.query(Payment).filter(Payment.order_id == order.id).first()
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        data.append({
            "id": order.id, "order_number": order.order_number,
            "created_at": order.created_at, "status": order.status,
            "subtotal": float(order.subtotal),
            "shipping_amount": float(order.shipping_amount),
            "total_amount": float(order.total_amount), "currency": order.currency,
            "payment_status": payment.status if payment else "unavailable",
            "items_count": sum(i.quantity for i in items),
            "items": [{
                "product_id": i.product_id, "product_name": i.product_name,
                "sku": i.sku, "image_url": i.image_url, "quantity": i.quantity,
                "selected_size": i.selected_size, "selected_color": i.selected_color,
                "unit_price": float(i.unit_price), "line_total": float(i.line_total),
            } for i in items],
        })
    return APIResponse(data=data)


@router.get("/{order_id}")
def get_my_order(order_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")
    order = db.query(Order).filter(
        Order.id == order_id, Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    return APIResponse(data={
        "id": order.id, "order_number": order.order_number,
        "created_at": order.created_at, "updated_at": order.updated_at,
        "status": order.status, "subtotal": float(order.subtotal),
        "shipping_amount": float(order.shipping_amount),
        "total_amount": float(order.total_amount), "currency": order.currency,
        "payment": ({
            "provider": payment.provider, "status": payment.status,
            "payment_id": payment.razorpay_payment_id,
        } if payment else None),
        "delivery": {
            "recipient_name": order.recipient_name, "phone": order.phone,
            "address_line1": order.address_line1, "address_line2": order.address_line2,
            "landmark": order.landmark, "city": order.city, "state": order.state,
            "postal_code": order.postal_code, "country": order.country,
        },
        "items": [{
            "product_id": i.product_id, "product_name": i.product_name,
            "sku": i.sku, "image_url": i.image_url, "quantity": i.quantity,
            "selected_size": i.selected_size, "selected_color": i.selected_color,
            "unit_price": float(i.unit_price), "line_total": float(i.line_total),
        } for i in items],
    })


@router.post("/verify-payment")
def verify_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id,
    ).with_for_update().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payment = db.query(Payment).filter(
        Payment.order_id == order.id
    ).with_for_update().first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    if payment.razorpay_order_id != request.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Payment order mismatch")

    if payment.status == "paid" and order.status == "confirmed":
        if payment.razorpay_payment_id == request.razorpay_payment_id:
            return APIResponse(data={
                "verified": True,
                "order_id": order.id,
                "order_number": order.order_number,
                "status": order.status,
            })
        raise HTTPException(status_code=409, detail="Order already paid")

    if payment.status != "created":
        raise HTTPException(status_code=409, detail="Payment cannot be verified")

    client = get_razorpay_client()

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature,
        })

        razorpay_payment = client.payment.fetch(request.razorpay_payment_id)

        if razorpay_payment.get("order_id") != payment.razorpay_order_id:
            raise HTTPException(status_code=400, detail="Payment order mismatch")

        if int(razorpay_payment.get("amount", 0)) != payment.amount_paise:
            raise HTTPException(status_code=400, detail="Payment amount mismatch")

        if razorpay_payment.get("currency") != payment.currency:
            raise HTTPException(status_code=400, detail="Payment currency mismatch")

        if razorpay_payment.get("status") != "captured":
            raise HTTPException(
                status_code=409,
                detail="Payment is not captured yet. Please wait for confirmation.",
            )

        payment.razorpay_payment_id = request.razorpay_payment_id
        payment.status = "paid"
        order.status = "confirmed"

        db.commit()

        return APIResponse(data={
            "verified": True,
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.status,
        })

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Razorpay payment verification failed")
        raise HTTPException(
            status_code=400,
            detail="Payment verification failed",
        ) from exc
