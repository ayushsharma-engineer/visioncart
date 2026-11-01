
import json
import re
import urllib.request
from decimal import Decimal

from app.db.session import SessionLocal
from app.models.product import Product

DATA_URL = (
    "https://raw.githubusercontent.com/"
    "arturayupov/womens-fashion-catalog-open-data/"
    "main/data/products.json"
)

LIMIT = 2000

# Approximate conversion for demo display only, not live FX.
USD_TO_INR = Decimal("85")


def clean_text(value):
    if not value:
        return ""
    return re.sub(r"<[^>]+>", " ", str(value)).strip()


def import_products():
    print("Downloading fashion catalogue...")

    request = urllib.request.Request(
        DATA_URL,
        headers={"User-Agent": "VisionCartAI-Catalog-Importer"},
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        source = json.loads(response.read().decode("utf-8"))

    if not isinstance(source, list):
        raise ValueError("Unexpected dataset format; database unchanged.")

    db = SessionLocal()
    inserted = 0
    skipped = 0

    try:
        for item in source:
            if inserted >= LIMIT:
                break

            source_id = str(item.get("id") or item.get("handle") or "")
            if not source_id:
                skipped += 1
                continue

            product_id = f"VC-LIVO-{source_id}"
            existing = db.query(Product).filter_by(
                product_id=product_id
            ).first()

            if existing:
                skipped += 1
                continue

            price_data = item.get("price") or {}
            price_usd = price_data.get("min_usd")

            if price_usd is None:
                variants = item.get("variants") or []
                prices = [
                    v.get("price_usd")
                    for v in variants
                    if v.get("price_usd") is not None
                ]
                if not prices:
                    skipped += 1
                    continue
                price_usd = min(prices)

            price_inr = (
                Decimal(str(price_usd)) * USD_TO_INR
            ).quantize(Decimal("0.01"))

            variants = item.get("variants") or []
            colors = set()
            sizes = set()

            for variant in variants:
                options = variant.get("options") or {}
                if options.get("Color"):
                    colors.add(str(options["Color"]))
                if options.get("Size"):
                    sizes.add(str(options["Size"]))

            images = item.get("images") or []
            image_url = (
                item.get("featured_image_url")
                or (images[0].get("url") if images else None)
            )

            category_data = item.get("category") or {}
            category = (
                category_data.get("name")
                or item.get("product_type")
                or "Clothing"
            )

            fabric = (item.get("metafields") or {}).get("fabric")
            occasions = [
                tag for tag in (item.get("tags") or [])
                if tag.lower() in {
                    "casual", "formal", "party", "wedding",
                    "summer", "workwear", "festive"
                }
            ]

            sku = f"LV-{source_id}"[:100]

            product = Product(
                product_id=product_id,
                sku=sku,
                name=clean_text(item.get("title"))[:255],
                category=category[:100],
                subcategory=(
                    item.get("product_type") or category
                )[:100],
                description=clean_text(item.get("description")),
                brand=item.get("vendor") or "Livostyle",
                price=price_inr,
                image_url=image_url,
                colors=sorted(colors),
                available_sizes=sorted(sizes),
                material=fabric,
                occasions=occasions,
                is_demo=True,
                is_active=True,
            )

            db.add(product)
            inserted += 1

            if inserted % 100 == 0:
                db.commit()
                print(f"Imported {inserted} products...")

        db.commit()
        print(f"Finished. Imported: {inserted}; skipped: {skipped}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import_products()
