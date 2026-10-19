"use client";

import { useRouter } from "next/navigation";
import { seller } from "@/lib/services";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { ProductForm } from "@/components/seller/product-form";
import { useToast } from "@/components/providers/toast";

export default function NewProduct() {
  useDocumentTitle("Add product");
  const router = useRouter();
  const toast = useToast();
  return (
    <section><h2 className="mb-6 font-display text-2xl font-semibold">Add a product</h2>
      <ProductForm submitLabel="Publish product" onSubmit={async (input) => { await seller.createProduct(input); toast.success("Product created"); router.push("/seller/products"); }} /></section>
  );
}
