from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.address import Address
from app.models.user import User
from app.schemas.address import AddressCreate, AddressUpdate
from app.schemas.common import APIResponse
from app.core.dependencies import get_current_user

router = APIRouter()


def customer_only(user: User):
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")


def clear_default(db: Session, user_id: int):
    db.query(Address).filter(
        Address.user_id == user_id,
        Address.is_default.is_(True),
    ).update({"is_default": False}, synchronize_session=False)


def address_data(address: Address):
    return {
        "id": address.id,
        "label": address.label,
        "recipient_name": address.recipient_name,
        "phone": address.phone,
        "address_line1": address.address_line1,
        "address_line2": address.address_line2,
        "landmark": address.landmark,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
        "country": address.country,
        "latitude": address.latitude,
        "longitude": address.longitude,
        "is_default": address.is_default,
    }


@router.get("/")
def list_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_only(current_user)
    addresses = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.id.desc())
        .all()
    )
    return APIResponse(data=[address_data(a) for a in addresses])


@router.post("/")
def create_address(
    request: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_only(current_user)

    try:
        values = request.model_dump()
        if values["is_default"] or not db.query(Address).filter(
            Address.user_id == current_user.id
        ).first():
            clear_default(db, current_user.id)
            values["is_default"] = True

        address = Address(user_id=current_user.id, **values)
        db.add(address)
        db.commit()
        db.refresh(address)
        return APIResponse(data=address_data(address))
    except Exception:
        db.rollback()
        raise


@router.put("/{address_id}")
def update_address(
    address_id: int,
    request: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_only(current_user)

    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    try:
        values = request.model_dump()
        if values["is_default"]:
            clear_default(db, current_user.id)

        for key, value in values.items():
            setattr(address, key, value)

        db.commit()
        db.refresh(address)
        return APIResponse(data=address_data(address))
    except Exception:
        db.rollback()
        raise


@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_only(current_user)

    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    was_default = address.is_default
    try:
        db.delete(address)
        db.flush()

        if was_default:
            replacement = db.query(Address).filter(
                Address.user_id == current_user.id
            ).order_by(Address.id.desc()).first()
            if replacement:
                replacement.is_default = True

        db.commit()
        return APIResponse(data={"message": "Address deleted successfully"})
    except Exception:
        db.rollback()
        raise


@router.patch("/{address_id}/default")
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_only(current_user)

    address = db.query(Address).filter(
        Address.id == address_id,
        Address.user_id == current_user.id,
    ).first()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    try:
        clear_default(db, current_user.id)
        address.is_default = True
        db.commit()
        db.refresh(address)
        return APIResponse(data=address_data(address))
    except Exception:
        db.rollback()
        raise
