from pathlib import Path

ROOT = Path(__file__).resolve().parent
frontend = ROOT / "frontend"
backend = ROOT / "backend"

navbar = frontend / "components" / "Navbar.tsx"
home = frontend / "app" / "page.tsx"
rag = backend / "app" / "ai" / "services" / "rag_service.py"

for path in (navbar, home, rag):
    if not path.is_file():
        raise SystemExit(f"STOP: file not found: {path}")

nav_text = navbar.read_text(encoding="utf-8")
home_text = home.read_text(encoding="utf-8")
rag_text = rag.read_text(encoding="utf-8")

nav_count = nav_text.count('href="/ai"')
home_count = home_text.count('href="/ai"')

old_rag = """            image_url = _get_field(details, "Image URL")
            if image_url and not image_url.startswith(("https://", "http://")):
                image_url = ""
                category = _get_field(details, "Category")
                colour = _get_field(details, "Color")
                description = _get_field(details, "Description")
                products.append({
                    "product_id": product.product_id,
                    "product_name": product.product_name,
                    "image_url": image_url or None,
                    "category": category,
                    "colour": colour,
                    "description": description,
                    })
                context_parts.append(
                    f"Product name: {product.product_name}\\n"
                    f"Product details:\\n{details}"
                    )
"""

new_rag = """            image_url = _get_field(details, "Image URL")
            if not image_url.startswith(("https://", "http://")):
                image_url = ""

            category = _get_field(details, "Category")
            colour = _get_field(details, "Color")
            description = _get_field(details, "Description")
            products.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "image_url": image_url or None,
                "category": category,
                "colour": colour,
                "description": description,
            })
            context_parts.append(
                f"Product name: {product.product_name}\\n"
                f"Product details:\\n{details}"
            )
"""

if nav_count == 0:
    raise SystemExit('STOP: Navbar has no href="/ai" link to redirect.')
if home_count == 0:
    raise SystemExit('STOP: homepage has no href="/ai" link to redirect.')
if rag_text.count(old_rag) != 1:
    raise SystemExit("STOP: RAG block mismatch; no files written.")

navbar.write_text(nav_text.replace('href="/ai"', 'href="/ai-lab"'), encoding="utf-8")
home.write_text(home_text.replace('href="/ai"', 'href="/ai-lab"'), encoding="utf-8")
rag.write_text(rag_text.replace(old_rag, new_rag), encoding="utf-8")

print(f"UPDATED: {navbar} ({nav_count} AI navigation links)")
print(f"UPDATED: {home} ({home_count} homepage AI links)")
print(f"UPDATED: {rag} (fixed RAG product extraction)")
print("AI Assistant now opens /ai-lab.")
