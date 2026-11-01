import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";

export default function CollectionPage({
	title,
	subtitle,
	category,
}: {
	title: string;
	subtitle: string;
	category: string;
}) {
	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-slate-50">
				<section className="bg-gradient-to-r from-blue-50 to-indigo-100">
					<div className="mx-auto max-w-[1400px] px-4 py-12 lg:px-8">
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
							VisionCart Collections
						</p>
						<h1 className="mt-2 text-4xl font-bold">{title}</h1>
						<p className="mt-3 max-w-xl text-gray-600">{subtitle}</p>
						<Link
							href="/shop"
							className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
						>
							Shop all clothing →
						</Link>
					</div>
				</section>
				<div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
					<ProductGrid category={category} pageSize={40} />
				</div>
			</main>
		</>
	);
}
