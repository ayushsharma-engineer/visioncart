"use client";

import { useParams, useRouter } from "next/navigation";
import { seller } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { ProductForm } from "@/components/seller/product-form";
import { AsyncError } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/providers/toast";

export default function EditProduct() {
  useDocumentTitle("Edit product");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(`seller:product:${id}`, (s) => seller.getProduct(Number(id), { signal: s }));
  if (error) return <AsyncError error={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton className="h-96" />;
  if (!data) return null;
  return (
    <section><h2 className="mb-6 font-display text-2xl font-semibold">Edit product</h2>
      <ProductForm initial={data} submitLabel="Save changes" onSubmit={async (input) => { await seller.updateProduct(data.id, input); toast.success("Changes saved"); router.push("/seller/products"); }} /></section>
  );
}
