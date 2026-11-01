
export type Product = {
  product_id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  brand: string | null;
  price: number;
  image_url: string | null;
  colors: string[];
  available_sizes: string[];
  material: string | null;
  occasions: string[];
};

type ProductListResponse = {
  data: {
    items: Product[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchProducts(params: {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
} = {}): Promise<ProductListResponse["data"]> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const response = await fetch(
    `${API_URL}/api/v1/products/?${query.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Product API failed: ${response.status}`);
  }

  const result: ProductListResponse = await response.json();
  return result.data;
}

export async function fetchProduct(
  productId: string
): Promise<Product> {
  const response = await fetch(
    `${API_URL}/api/v1/products/${encodeURIComponent(productId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Product API failed: ${response.status}`);
  }

  const result: { data: Product } = await response.json();
  return result.data;
}
