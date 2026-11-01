# scripts/seed_products.py

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db.session import SessionLocal
from app.models.product import Product


PRODUCTS = [
    {
        "product_id": "VC-KURTA-001",
        "sku": "VC-KURTA-001",
        "name": "Men's Classic Cotton Kurta",
        "category": "Indian Wear",
        "subcategory": "Kurta",
        "description": "Comfortable cotton kurta for everyday wear and festive occasions.",
        "brand": "VisionCart Studio",
        "price": 899.00,
        "image_url": None,
        "colors": ["White", "Black", "Navy Blue"],
        "available_sizes": ["S", "M", "L", "XL", "XXL"],
        "material": "Cotton",
        "occasions": ["Casual", "Festive"],
    },
    {
        "product_id": "VC-SAREE-001",
        "sku": "VC-SAREE-001",
        "name": "Women's Elegant Printed Saree",
        "category": "Indian Wear",
        "subcategory": "Saree",
        "description": "Elegant printed saree suitable for celebrations and family gatherings.",
        "brand": "VisionCart Studio",
        "price": 1499.00,
        "image_url": None,
        "colors": ["Red", "Green", "Blue"],
        "available_sizes": ["Free Size"],
        "material": "Georgette",
        "occasions": ["Party", "Festive", "Wedding"],
    },
    {
        "product_id": "VC-SHIRT-001",
        "sku": "VC-SHIRT-001",
        "name": "Men's Slim Fit Casual Shirt",
        "category": "Western Wear",
        "subcategory": "Shirt",
        "description": "Versatile slim-fit shirt for office, outings and casual styling.",
        "brand": "VisionCart Studio",
        "price": 799.00,
        "image_url": None,
        "colors": ["White", "Blue", "Black"],
        "available_sizes": ["S", "M", "L", "XL"],
        "material": "Cotton Blend",
        "occasions": ["Casual", "Office"],
    },
    {
        "product_id": "VC-JEANS-001",
        "sku": "VC-JEANS-001",
        "name": "Men's Regular Fit Denim Jeans",
        "category": "Western Wear",
        "subcategory": "Jeans",
        "description": "Regular-fit denim jeans designed for everyday comfort.",
        "brand": "VisionCart Studio",
        "price": 1199.00,
        "image_url": None,
        "colors": ["Blue", "Black"],
        "available_sizes": ["28", "30", "32", "34", "36"],
        "material": "Denim",
        "occasions": ["Casual", "Travel"],
    },
    {
        "product_id": "VC-DRESS-001",
        "sku": "VC-DRESS-001",
        "name": "Women's Floral Summer Dress",
        "category": "Western Wear",
        "subcategory": "Dress",
        "description": "Lightweight floral dress suitable for summer outings and holidays.",
        "brand": "VisionCart Studio",
        "price": 1299.00,
        "image_url": None,
        "colors": ["Pink", "Yellow", "Blue"],
        "available_sizes": ["XS", "S", "M", "L", "XL"],
        "material": "Rayon",
        "occasions": ["Casual", "Vacation", "Party"],
    },
    {
        "product_id": "VC-LEHENGA-001",
        "sku": "VC-LEHENGA-001",
        "name": "Women's Festive Embroidered Lehenga",
        "category": "Indian Wear",
        "subcategory": "Lehenga",
        "description": "Festive embroidered lehenga for weddings and special celebrations.",
        "brand": "VisionCart Studio",
        "price": 4999.00,
        "image_url": None,
        "colors": ["Maroon", "Pink", "Green"],
        "available_sizes": ["S", "M", "L", "XL"],
        "material": "Silk Blend",
        "occasions": ["Wedding", "Festive", "Party"],
    },
    {
        "product_id": "VC-KIDS-001",
        "sku": "VC-KIDS-001",
        "name": "Kids' Cotton Printed T-Shirt",
        "category": "Kids Wear",
        "subcategory": "T-Shirt",
        "description": "Soft cotton printed T-shirt for children's everyday wear.",
        "brand": "VisionCart Studio",
        "price": 399.00,
        "image_url": None,
        "colors": ["Red", "Blue", "Yellow"],
        "available_sizes": ["2Y", "4Y", "6Y", "8Y", "10Y"],
        "material": "Cotton",
        "occasions": ["Casual", "Everyday"],
    },
    {
        "product_id": "VC-SHERWANI-001",
        "sku": "VC-SHERWANI-001",
        "name": "Men's Wedding Sherwani",
        "category": "Indian Wear",
        "subcategory": "Sherwani",
        "description": "Traditional wedding sherwani for formal ceremonies and celebrations.",
        "brand": "VisionCart Studio",
        "price": 5999.00,
        "image_url": None,
        "colors": ["Cream", "Gold", "Maroon"],
        "available_sizes": ["S", "M", "L", "XL"],
        "material": "Silk Blend",
        "occasions": ["Wedding", "Festive"],
    },
    {
        "product_id": "VC-SALWAR-001",
        "sku": "VC-SALWAR-001",
        "name": "Women's Straight Salwar Suit",
        "category": "Indian Wear",
        "subcategory": "Salwar Suit",
        "description": "Straight-cut salwar suit suitable for daily wear and family occasions.",
        "brand": "VisionCart Studio",
        "price": 1799.00,
        "image_url": None,
        "colors": ["Blue", "Pink", "Green"],
        "available_sizes": ["S", "M", "L", "XL", "XXL"],
        "material": "Cotton Blend",
        "occasions": ["Casual", "Office", "Festive"],
    },
    {
        "product_id": "VC-TSHIRT-001",
        "sku": "VC-TSHIRT-001",
        "name": "Unisex Essential Cotton T-Shirt",
        "category": "Western Wear",
        "subcategory": "T-Shirt",
        "description": "Everyday essential T-shirt with a comfortable regular fit.",
        "brand": "VisionCart Studio",
        "price": 499.00,
        "image_url": None,
        "colors": ["White", "Black", "Grey", "Navy Blue"],
        "available_sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        "material": "Cotton",
        "occasions": ["Casual", "Travel", "Everyday"],
    },
]


def seed_products():
    db = SessionLocal()

    inserted = 0
    skipped = 0

    try:
        for product_data in PRODUCTS:
            existing = db.scalar(
                select(Product.id).where(
                    (Product.product_id == product_data["product_id"])
                    | (Product.sku == product_data["sku"])
                )
            )

            if existing is not None:
                skipped += 1
                continue

            db.add(
                Product(
                    **product_data,
                    is_demo=True,
                    is_active=True,
                )
            )
            inserted += 1

        db.commit()

        print(f"Products inserted: {inserted}")
        print(f"Products skipped (already exist): {skipped}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_products()