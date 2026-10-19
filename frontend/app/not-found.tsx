import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  return <div className="mx-auto max-w-3xl px-4 py-20"><EmptyState icon="search" title="Page not found" text="The page you're looking for doesn't exist or has moved." action={{ label: "Back to home", href: "/" }} /></div>;
}
