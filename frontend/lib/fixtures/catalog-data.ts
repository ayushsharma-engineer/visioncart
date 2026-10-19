/**
 * DEV FIXTURES — sample catalog for reviewing the storefront UI without a product API.
 *
 * Read-only by design. Nothing here can place an order, take a payment, create a seller
 * product or produce an AI answer. Image IDs are reused from the original homepage.
 * Active only when NEXT_PUBLIC_DATA_MODE=fixtures (never in production builds).
 */
import type { Category, Product, ProductAttributes, ProductVariant, Review } from "@/types/domain";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const IMG = {
  dress: img("1496747611176-843222e1e57c"),
  men: img("1488161628813-04466f872be2"),
  shoes: img("1542291026-7eec264c27ff"),
  backpack: img("1553062407-98eeb64c6a62"),
  serum: img("1556228578-8c89e6adf883"),
  beautyCover: img("1596462502278-27bfdc403348"),
  sports: img("1517836357463-d25dfeac3438"),
  accessoriesCover: img("1523779917675-b6ed3a42a561"),
  watch: img("1523275335684-37898b6baf30"),
  sunglasses: img("1511499767150-a48a237f0083"),
  shirt: img("1525507119028-ed4c629a60a3"),
  handbag: img("1584917865442-de89df76afd3"),
  kids: img("1519340241574-2cec6aef0c01"),
};

export const FIXTURE_CATEGORIES: Category[] = [
  { id: 1, name: "Women", image_url: IMG.dress },
  { id: 2, name: "Men", image_url: IMG.men },
  { id: 3, name: "Kids", image_url: IMG.kids },
  { id: 4, name: "Footwear", image_url: IMG.shoes },
  { id: 5, name: "Bags", image_url: IMG.backpack },
  { id: 6, name: "Accessories", image_url: IMG.accessoriesCover },
  { id: 7, name: "Beauty", image_url: IMG.beautyCover },
  { id: 8, name: "Sportswear", image_url: IMG.sports },
].map((c) => ({ ...c, created_at: "2026-01-01T00:00:00Z" }));

const STOCK_PATTERN = [8, 5, 0, 3, 12, 2, 6, 1];

let variantId = 1000;
function variants(
  productId: number,
  prefix: string,
  sizes: (string | null)[],
  colors: (string | null)[],
  imageByColor: Record<string, string> = {},
): ProductVariant[] {
  const out: ProductVariant[] = [];
  let i = productId; // offset so products don't all share the same stock pattern
  for (const color of colors) {
    for (const size of sizes) {
      out.push({
        id: variantId++,
        product_id: productId,
        sku: [prefix, color?.replace(/\s+/g, "").slice(0, 3).toUpperCase(), size?.replace(/\s+/g, "")]
          .filter(Boolean)
          .join("-"),
        size,
        color,
        stock: STOCK_PATTERN[i++ % STOCK_PATTERN.length],
        image_url: color ? (imageByColor[color] ?? null) : null,
      });
    }
  }
  return out;
}

const LETTER = ["XS", "S", "M", "L", "XL"];

interface Seed {
  id: number;
  seller: number;
  sellerName: string;
  name: string;
  brand: string;
  category: number;
  price: number;
  compareAt: number;
  rating: number;
  reviews: number;
  image: string;
  created: string;
  description: string;
  attributes: ProductAttributes;
  sizes: (string | null)[];
  colors: (string | null)[];
  prefix: string;
}

const SEEDS: Seed[] = [
  {
    id: 1, seller: 1, sellerName: "Atelier Rouge", name: "Floral Summer Dress", brand: "Aarya", category: 1,
    price: 1599, compareAt: 2499, rating: 4.7, reviews: 2100, image: IMG.dress, created: "2026-09-20T09:00:00Z",
    description: "A breezy midi dress with a wrap neckline and a relaxed, flowing skirt. Light enough for long afternoons, polished enough for brunch.",
    attributes: { material: "Viscose crepe", composition: "100% viscose", fit: "Relaxed", care_instructions: "Machine wash cold, line dry", occasions: ["Brunch", "Casual outing", "Vacation"], styles: ["Feminine", "Boho"], suitable_seasons: ["Summer", "Spring"], patterns: ["Floral"] },
    sizes: LETTER, colors: ["Blush", "Sage Green", "Navy"], prefix: "AAR-DRS",
  },
  {
    id: 2, seller: 2, sellerName: "Stride Labs", name: "Cloudlite Running Shoes", brand: "Stride", category: 4,
    price: 3999, compareAt: 5999, rating: 4.6, reviews: 3400, image: IMG.shoes, created: "2026-09-18T09:00:00Z",
    description: "Cushioned daily trainers with a breathable knit upper and a responsive foam midsole. Built for 5K mornings and everything after.",
    attributes: { material: "Engineered mesh", fit: "True to size", care_instructions: "Wipe clean; air dry", occasions: ["Running", "Gym", "Everyday"], styles: ["Sporty"], suitable_seasons: ["All year"] },
    sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], colors: ["Black", "White"], prefix: "STR-RUN",
  },
  {
    id: 3, seller: 3, sellerName: "Wanderkit", name: "Travel Laptop Backpack", brand: "Wanderkit", category: 5,
    price: 2199, compareAt: 3499, rating: 4.5, reviews: 1200, image: IMG.backpack, created: "2026-09-10T09:00:00Z",
    description: "A water-resistant 28L backpack with a padded 15.6\" laptop sleeve, hidden passport pocket and a luggage-strap pass-through.",
    attributes: { material: "Recycled polyester", fit: "One size", care_instructions: "Spot clean with a damp cloth", occasions: ["Travel", "Work", "College"], styles: ["Utility"] },
    sizes: ["One Size"], colors: ["Charcoal", "Navy"], prefix: "WAN-BKP",
  },
  {
    id: 4, seller: 4, sellerName: "Chronos & Co", name: "Classic Analog Watch", brand: "Chronos", category: 6,
    price: 4499, compareAt: 6999, rating: 4.4, reviews: 980, image: IMG.watch, created: "2026-08-30T09:00:00Z",
    description: "A slim 40mm analog watch with a sapphire-coated crystal and a genuine leather strap. Understated and easy to dress up.",
    attributes: { material: "Stainless steel, leather", fit: "Adjustable strap", care_instructions: "Keep away from water; wipe with a dry cloth", occasions: ["Work", "Formal", "Gifting"], styles: ["Classic", "Minimal"] },
    sizes: ["One Size"], colors: ["Silver", "Gold"], prefix: "CHR-WTC",
  },
  {
    id: 5, seller: 4, sellerName: "Chronos & Co", name: "Classic Sunglasses", brand: "Chronos", category: 6,
    price: 6299, compareAt: 8499, rating: 4.7, reviews: 2800, image: IMG.sunglasses, created: "2026-08-22T09:00:00Z",
    description: "Polarised UV400 lenses in a timeless acetate frame. Light on the face, sharp in the sun.",
    attributes: { material: "Acetate, polarised glass", fit: "Medium", care_instructions: "Clean with the included microfibre cloth", occasions: ["Travel", "Everyday", "Driving"], styles: ["Classic"], suitable_seasons: ["Summer"] },
    sizes: ["One Size"], colors: ["Black", "Tan"], prefix: "CHR-SUN",
  },
  {
    id: 6, seller: 5, sellerName: "Pure Ritual", name: "Minimalist Face Serum", brand: "Pure Ritual", category: 7,
    price: 599, compareAt: 899, rating: 4.6, reviews: 1100, image: IMG.serum, created: "2026-09-25T09:00:00Z",
    description: "A lightweight 10% niacinamide serum that evens tone and refines texture without a sticky finish. Fragrance-free.",
    attributes: { material: "Niacinamide, zinc, hyaluronic acid", fit: "—", care_instructions: "Store in a cool, dry place; patch test first", occasions: ["Daily skincare"], styles: ["Minimal"] },
    sizes: ["30 ml", "50 ml"], colors: [null], prefix: "PUR-SRM",
  },
  {
    id: 7, seller: 1, sellerName: "Atelier Rouge", name: "Men's Casual Linen Shirt", brand: "Northline", category: 2,
    price: 1299, compareAt: 1999, rating: 4.5, reviews: 2300, image: IMG.shirt, created: "2026-09-14T09:00:00Z",
    description: "A soft linen-blend shirt with a relaxed collar and a slightly longer hem. Wear it open over a tee or buttoned up.",
    attributes: { material: "Linen-cotton blend", composition: "55% linen, 45% cotton", fit: "Regular", care_instructions: "Machine wash cold; iron on low", occasions: ["Casual", "Weekend", "Vacation"], styles: ["Smart casual"], suitable_seasons: ["Summer", "Spring"] },
    sizes: LETTER.slice(1), colors: ["White", "Sky Blue", "Olive"], prefix: "NOR-SHT",
  },
  {
    id: 8, seller: 6, sellerName: "Maison Kalyani", name: "Leather Handbag", brand: "Kalyani", category: 5,
    price: 2799, compareAt: 4499, rating: 4.6, reviews: 856, image: IMG.handbag, created: "2026-09-02T09:00:00Z",
    description: "A structured top-handle bag in vegetable-tanned leather with a suede-lined interior and a detachable strap.",
    attributes: { material: "Vegetable-tanned leather", fit: "One size", care_instructions: "Condition with leather balm; keep dry", occasions: ["Work", "Evening", "Gifting"], styles: ["Classic", "Elegant"] },
    sizes: ["One Size"], colors: ["Tan", "Black", "Burgundy"], prefix: "KAL-HBG",
  },
  {
    id: 9, seller: 7, sellerName: "Little Loom", name: "Kids Cotton Tee Set", brand: "Little Loom", category: 3,
    price: 799, compareAt: 1199, rating: 4.4, reviews: 640, image: IMG.kids, created: "2026-09-08T09:00:00Z",
    description: "A pack of two soft combed-cotton tees with tag-free necks. Made to survive playground days and a hundred washes.",
    attributes: { material: "Combed cotton", composition: "100% cotton", fit: "Regular", care_instructions: "Machine wash warm", occasions: ["Play", "School", "Everyday"], styles: ["Casual"] },
    sizes: ["2-3Y", "4-5Y", "6-7Y"], colors: ["Yellow", "Teal"], prefix: "LIT-TEE",
  },
  {
    id: 10, seller: 2, sellerName: "Stride Labs", name: "Performance Training Tee", brand: "Stride", category: 8,
    price: 899, compareAt: 1499, rating: 4.3, reviews: 1500, image: IMG.sports, created: "2026-09-16T09:00:00Z",
    description: "A moisture-wicking training tee with flatlock seams and a quick-dry finish. Stays fresh through the hardest sets.",
    attributes: { material: "Recycled polyester blend", fit: "Athletic", care_instructions: "Machine wash cold; do not iron", occasions: ["Gym", "Running", "Yoga"], styles: ["Sporty"], suitable_seasons: ["All year"] },
    sizes: [...LETTER.slice(1), "XXL"], colors: ["Black", "Teal", "Rust"], prefix: "STR-TEE",
  },
  {
    id: 11, seller: 1, sellerName: "Atelier Rouge", name: "Men's Slim Fit Jacket", brand: "Northline", category: 2,
    price: 3299, compareAt: 5499, rating: 4.5, reviews: 720, image: IMG.men, created: "2026-09-22T09:00:00Z",
    description: "A lightweight slim-fit jacket with a clean collar and two zip pockets. Layers over a shirt or a tee without bulk.",
    attributes: { material: "Cotton twill", composition: "98% cotton, 2% elastane", fit: "Slim", care_instructions: "Dry clean recommended", occasions: ["Work", "Evening", "Travel"], styles: ["Smart casual", "Minimal"], suitable_seasons: ["Autumn", "Winter", "Spring"] },
    sizes: LETTER.slice(1), colors: ["Black", "Olive"], prefix: "NOR-JKT",
  },
];

const categoryById = new Map(FIXTURE_CATEGORIES.map((c) => [c.id, c]));

export const FIXTURE_PRODUCTS: Product[] = SEEDS.map((s) => ({
  id: s.id,
  seller_id: s.seller,
  seller_name: s.sellerName,
  name: s.name,
  brand: s.brand,
  description: s.description,
  category_id: s.category,
  category: categoryById.get(s.category),
  price: s.price,
  compare_at_price: s.compareAt,
  stock: 0,
  image_url: s.image,
  images: [s.image],
  status: "active",
  rating_average: s.rating,
  review_count: s.reviews,
  attributes: s.attributes,
  created_at: s.created,
  updated_at: s.created,
  variants: variants(s.id, s.prefix, s.sizes, s.colors),
}));

export const FIXTURE_REVIEWS: Review[] = [
  { id: 1, product_id: 1, user_id: 901, author_name: "Ananya S.", rating: 5, comment: "Fabric is lovely and it fits exactly like the size chart says. The wrap neckline is flattering.", status: "active", created_at: "2026-09-02T10:00:00Z" },
  { id: 2, product_id: 1, user_id: 902, author_name: "Meera K.", rating: 4, comment: "Gorgeous print. Slightly sheer in the lighter colour, so wear a slip.", status: "active", created_at: "2026-08-21T10:00:00Z" },
  { id: 3, product_id: 2, user_id: 903, author_name: "Rohit D.", rating: 5, comment: "Comfortable straight out of the box. Used them for a half marathon without a blister.", status: "active", created_at: "2026-09-05T10:00:00Z" },
  { id: 4, product_id: 2, user_id: 904, author_name: "Kabir M.", rating: 4, comment: "Great cushioning. Runs a little snug — consider sizing up.", status: "active", created_at: "2026-08-11T10:00:00Z" },
  { id: 5, product_id: 7, user_id: 905, author_name: "Vikram P.", rating: 5, comment: "Breathable and doesn't crease as badly as other linen shirts I've owned.", status: "active", created_at: "2026-09-01T10:00:00Z" },
  { id: 6, product_id: 8, user_id: 906, author_name: "Divya R.", rating: 5, comment: "The leather smells and feels premium. Strap is sturdy.", status: "active", created_at: "2026-08-28T10:00:00Z" },
];
