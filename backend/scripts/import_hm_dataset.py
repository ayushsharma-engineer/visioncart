
from __future__ import annotations

import argparse
import logging
from pathlib import Path

import pandas as pd
from sqlalchemy.dialects.postgresql import insert
from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.product_embedding import ProductEmbedding


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

DATASET_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "hm"
    / "hm_ecommerce_products_enriched.parquet"
)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

COLUMNS = [
    "article_id",
    "prod_name",
    "product_type_name",
    "product_group_name",
    "colour_group_name",
    "department_name",
    "section_name",
    "detail_desc",
    "image_url",
]


def clean(value: object) -> str:
    if value is None or pd.isna(value):
        return ""
    return str(value).strip()


def make_product(row: dict) -> tuple[str, str, str]:
    product_id = clean(row.get("article_id"))
    name = clean(row.get("prod_name")) or "Unnamed clothing item"

    category = clean(row.get("product_type_name"))
    group = clean(row.get("product_group_name"))
    colour = clean(row.get("colour_group_name"))
    department = clean(row.get("department_name"))
    section = clean(row.get("section_name"))
    description = clean(row.get("detail_desc"))
    image_url = clean(row.get("image_url"))

    knowledge_text = "\n".join(
        [
            f"Product name: {name}",
            f"Category: {category}",
            f"Product group: {group}",
            f"Color: {colour}",
            f"Department: {department}",
            f"Section: {section}",
            f"Description: {description}",
            f"Image URL: {image_url}",
        ]
    )

    return product_id, name[:255], knowledge_text


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import H&M products into VisionCart pgvector."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1000,
        help="Maximum products to process. Use 0 for all products.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Products per embedding/database batch.",
    )
    args = parser.parse_args()

    if args.limit < 0 or args.batch_size < 1:
        raise ValueError("Limit must be >= 0 and batch size must be >= 1")

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    logger.info("Reading dataset: %s", DATASET_PATH)

    df = pd.read_parquet(
        DATASET_PATH,
        columns=COLUMNS,
    )

    df = df.dropna(subset=["article_id"])
    df["article_id"] = df["article_id"].astype(str).str.strip()
    df = df[df["article_id"] != ""]
    df = df.drop_duplicates(subset=["article_id"], keep="first")

    if args.limit:
        df = df.head(args.limit)

    logger.info("Products selected: %s", len(df))
    logger.info("Loading embedding model: %s", MODEL_NAME)

    model = SentenceTransformer(MODEL_NAME)
    imported = 0

    with SessionLocal() as db:
        for start in range(0, len(df), args.batch_size):
            batch = df.iloc[start : start + args.batch_size]
            prepared = [
                make_product(row)
                for row in batch.to_dict(orient="records")
            ]

            prepared = [
                item for item in prepared
                if item[0] and item[2].strip()
            ]

            if not prepared:
                continue

            texts = [item[2] for item in prepared]

            vectors = model.encode(
                texts,
                batch_size=args.batch_size,
                normalize_embeddings=False,
                show_progress_bar=False,
            )

            if vectors.shape[1] != 384:
                raise ValueError(
                    f"Expected 384 dimensions, got {vectors.shape[1]}"
                )

            records = [
                {
                    "product_id": product_id,
                    "product_name": name,
                    "knowledge_text": knowledge_text,
                    "embedding": vector.tolist(),
                }
                for (product_id, name, knowledge_text), vector
                in zip(prepared, vectors)
            ]

            statement = insert(ProductEmbedding).values(records)
            statement = statement.on_conflict_do_update(
                constraint="uq_product_embeddings_product_id",
                set_={
                    "product_name": statement.excluded.product_name,
                    "knowledge_text": statement.excluded.knowledge_text,
                    "embedding": statement.excluded.embedding,
                },
            )

            try:
                db.execute(statement)
                db.commit()
            except Exception:
                db.rollback()
                raise

            imported += len(records)
            logger.info(
                "Processed %s / %s products",
                min(start + len(batch), len(df)),
                len(df),
            )

    logger.info("Import finished. Products processed: %s", imported)


if __name__ == "__main__":
    main()
