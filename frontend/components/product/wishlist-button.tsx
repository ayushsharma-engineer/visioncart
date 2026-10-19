"use client";

import type { Product } from "@/types/domain";
import { useWishlist } from "@/lib/stores/wishlist";
import { cn } from "@/lib/core/utils";
import { Icon } from "../ui/icon";
import { useToast } from "../providers/toast";

export function WishlistButton({ product, className, size = 18 }: { product: Product; className?: string; size?: number }) {
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const saved = has(product.id);
  return (
    <button type="button" aria-pressed={saved} aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        toggle({ productId: product.id, name: product.name, price: product.price, image: product.image_url, brand: product.brand ?? null });
        toast.info(saved ? "Removed from wishlist" : "Saved to wishlist on this device");
      }}
      className={cn("flex size-9 items-center justify-center rounded-full bg-surface/95 shadow-card transition hover:scale-105", saved ? "text-brand" : "text-ink", className)}>
      <Icon name="heart" size={size} filled={saved} />
    </button>
  );
}
