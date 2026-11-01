
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts, type Product } from "@/lib/products";
import Navbar from "@/components/Navbar";

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=85",
    alt: "Women's contemporary fashion",
    label: "WOMENSWEAR",
    caption: "Everyday, elevated.",
    position: "center 25%",
  },
  {
    image:
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1400&q=85",
    alt: "Men's contemporary fashion",
    label: "MENSWEAR",
    caption: "The modern essentials.",
    position: "center 25%",
  },
  {
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85",
    alt: "Contemporary fashion collection",
    label: "THE NEW COLLECTION",
    caption: "Made for your everyday.",
    position: "center 25%",
  },
  {
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85",
    alt: "Contemporary street fashion",
    label: "STREET EDIT",
    caption: "Find your own expression.",
    position: "center 25%",
  },
  {
    image:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1400&q=85",
    alt: "Women's fashion editorial",
    label: "THE STYLE EDIT",
    caption: "Less trend. More you.",
    position: "center 25%",
  },
];

const categories = [
  {
    name: "New Arrivals",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Dresses",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Shirts",
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Ethnic Wear",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=85",
  },
];

const fallbackProductImage =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=85";

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const result = await fetchProducts({
          page: 1,
          page_size: 4,
        });

        if (!cancelled) {
          setProducts(result.items);
          setProductsError(false);
        }
      } catch (error) {
        console.error("Failed to load homepage products:", error);

        if (!cancelled) {
          setProductsError(true);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#292923]">
      <div className="bg-[#30332c] px-4 py-2.5 text-center text-[9px] font-medium tracking-[0.18em] text-white sm:text-[10px]">
        A MORE PERSONAL WAY TO DISCOVER YOUR STYLE
      </div>

      <Navbar />

      {/* Hero */}
      <section className="px-3 pb-8 pt-3 sm:px-5 sm:pb-12 sm:pt-5">
        <div className="mx-auto grid max-w-[1600px] overflow-hidden bg-[#eeece4] md:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col items-start justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20 xl:px-20">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#68745b]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#68745b] sm:text-[10px]">
                THE NEW WARDROBE
              </p>
            </div>

            <h1 className="mt-7 max-w-xl text-[2.85rem] font-medium leading-[1.02] tracking-[-0.065em] sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]">
              Find less.
              <br />
              Wear{" "}
              <span className="font-serif font-normal italic text-[#68745b]">
                better.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#6d6d62] sm:text-base sm:leading-8">
              Thoughtful clothing for your everyday life. Explore pieces that
              fit your personal style, your occasion and your budget.
            </p>

            <form
              action="/shop"
              method="GET"
              className="mt-8 flex w-full max-w-lg items-center border-b border-[#a8a99b] pb-2"
            >
              <span aria-hidden="true" className="mr-3 text-2xl text-[#77786d]">
                ⌕
              </span>
              <input
                name="search"
                type="search"
                placeholder="Search shirts, dresses, kurtas..."
                aria-label="Search clothing"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#99998e]"
              />
              <button
                type="submit"
                aria-label="Search clothing"
                className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center bg-[#59654e] text-lg text-white transition hover:bg-[#424d3a]"
              >
                ↗
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[#77786d]">
              <span className="uppercase tracking-wider">Explore</span>
              {["Linen shirts", "Summer dresses", "Ethnic wear"].map((item) => (
                <a
                  key={item}
                  href={`/shop?search=${encodeURIComponent(item)}`}
                  className="underline decoration-[#c3c4b7] underline-offset-4 transition hover:text-[#46513f]"
                >
                  {item}
                </a>
              ))}
            </div>

            <a
              href="/ai-lab"
              className="mt-8 inline-flex items-center gap-3 border-b border-[#8c927e] pb-2 text-xs font-semibold uppercase tracking-[0.09em] text-[#485340] transition hover:text-[#68745b]"
            >
              Discover your style with AI <span>↗</span>
            </a>

            <p className="mt-10 text-[9px] uppercase tracking-[0.16em] text-[#858579]">
              PERSONAL STYLE · CONSIDERED CHOICES
            </p>
          </div>

          <div className="group relative min-h-[350px] overflow-hidden bg-[#d8d4c9] sm:min-h-[470px] md:min-h-[590px] lg:min-h-[660px]">
            {heroSlides.map((slide, index) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={slide.alt}
                loading={index === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                  index === activeSlide
                    ? "scale-100 opacity-100"
                    : "scale-[1.02] opacity-0"
                }`}
                style={{ objectPosition: slide.position }}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            <div className="absolute right-5 top-5 border border-white/60 bg-[#faf9f6]/90 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.13em] text-[#34362f] sm:right-8 sm:top-8">
              VISIONCARTAI / 0{activeSlide + 1}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white sm:bottom-8 sm:left-8 sm:right-8">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/75">
                  {heroSlides[activeSlide].label}
                </p>
                <p className="mt-2 text-xl font-medium sm:text-2xl">
                  {heroSlides[activeSlide].caption}
                </p>
                <div className="mt-4 flex gap-1.5">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.image}
                      type="button"
                      onClick={() => setActiveSlide(index)}
                      aria-label={`Show slide ${index + 1}`}
                      aria-pressed={index === activeSlide}
                      className={`h-1 transition-all duration-300 ${
                        index === activeSlide
                          ? "w-8 bg-white"
                          : "w-4 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveSlide((current) => (current + 1) % heroSlides.length)
                }
                aria-label="Next fashion image"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 text-lg transition hover:bg-white hover:text-[#292923]"
              >
                ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7a806e]">
              CURATED FOR YOU
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em] sm:text-3xl">
              Explore the collection
            </h2>
          </div>
          <a
            href="/shop"
            className="shrink-0 border-b border-[#a8a99b] pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-xs"
          >
            View all ↗
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-6">
          {categories.map((category, index) => (
            <a
              key={category.name}
              href={
                category.name === "Women"
                  ? "/women"
                  : category.name === "Men"
                    ? "/men"
                    : category.name === "Kids"
                      ? "/kids"
                      : category.name === "New Arrivals"
                        ? "/shop"
                        : `/shop?search=${encodeURIComponent(category.name)}`
              }
              className="group min-w-0"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#eeece4]">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#faf9f6]/90 text-xs transition group-hover:bg-[#59654e] group-hover:text-white">
                  ↗
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-3">
                <h3 className="text-sm font-medium">{category.name}</h3>
                <span className="text-[9px] text-[#858579]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* AI styling */}
      <section className="mx-auto max-w-[1600px] px-3 py-8 sm:px-5 sm:py-12">
        <div className="grid overflow-hidden bg-[#e9ebe1] md:grid-cols-2">
          <div className="flex flex-col items-start justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#68745b]">
              YOUR PERSONAL STYLE ASSISTANT
            </p>
            <h2 className="mt-5 text-4xl font-medium leading-[1.08] tracking-[-0.055em] sm:text-5xl">
              A little help.
              <br />
              <span className="font-serif font-normal italic text-[#68745b]">
                A better outfit.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#6d6d62]">
              Tell VisionCartAI where you are going, what you like and how much
              you want to spend. Explore clothing combinations made around
              your preferences.
            </p>
            <div className="mt-6 space-y-3 text-xs text-[#56594e]">
              <p className="flex items-center gap-3">
                <span className="text-[#68745b]">01</span>
                Outfits for your occasion
              </p>
              <p className="flex items-center gap-3">
                <span className="text-[#68745b]">02</span>
                Recommendations around your budget
              </p>
              <p className="flex items-center gap-3">
                <span className="text-[#68745b]">03</span>
                Clothing pieces that work together
              </p>
            </div>
            <a
              href="/ai-lab"
              className="mt-8 inline-flex items-center gap-5 bg-[#30332c] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#59654e]"
            >
              Explore AI shopping <span>↗</span>
            </a>
          </div>

          <div className="group relative min-h-[300px] overflow-hidden bg-[#d8d4c9] sm:min-h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=85"
              alt="Contemporary outfit inspiration"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white sm:bottom-8 sm:left-8">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/75">
                YOUR STYLE, REIMAGINED
              </p>
              <p className="mt-2 text-2xl font-medium sm:text-3xl">
                Make every piece count.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products from FastAPI */}
      <section className="mx-auto max-w-[1600px] px-4 py-9 sm:px-8 sm:py-12 lg:px-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7a806e]">
              THE STYLE EDIT
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em] sm:text-3xl">
              Pieces worth keeping.
            </h2>
            <p className="mt-2 text-xs text-[#858579] sm:text-sm">
              Everyday essentials, with room for your own style.
            </p>
          </div>
          <a
            href="/shop"
            className="shrink-0 border-b border-[#a8a99b] pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-xs"
          >
            Shop all ↗
          </a>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#eeece4]" />
                <div className="mt-4 h-3 w-2/3 bg-[#eeece4]" />
                <div className="mt-3 h-4 w-4/5 bg-[#eeece4]" />
                <div className="mt-3 h-3 w-1/3 bg-[#eeece4]" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="mt-7 border border-[#e5e3d9] px-5 py-8 text-center">
            <p className="text-sm">We couldn&apos;t load the collection right now.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 border-b border-[#a8a99b] pb-1 text-xs font-semibold"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-7 bg-[#eeece4] px-5 py-10 text-center">
            <p className="text-sm">No products are available yet.</p>
            <p className="mt-2 text-xs text-[#858579]">
              Add active products to your catalogue to display them here.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-4">
            {products.map((product) => (
              <article key={product.product_id} className="group min-w-0">
                <a
                  href={`/product/${encodeURIComponent(product.product_id)}`}
                  className="block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#eeece4]">
                    <img
                      src={product.image_url || fallbackProductImage}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 bg-[#faf9f6]/95 px-2 py-1.5 text-[8px] font-semibold tracking-[0.1em] text-[#59654e] sm:left-3 sm:top-3 sm:text-[9px]">
                      {product.subcategory || product.category || "CLOTHING"}
                    </span>
                    <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#faf9f6]/95 text-lg transition group-hover:bg-[#30332c] group-hover:text-white">
                      ↗
                    </span>
                  </div>

                  <p className="mt-3 text-[9px] uppercase tracking-[0.14em] text-[#858579]">
                    {product.brand || product.category || "VISIONCARTAI"}
                  </p>
                  <h3 className="mt-1.5 text-sm font-medium leading-5 group-hover:underline">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}

        <p className="mt-5 text-[10px] leading-5 text-[#8a897d]">
          Prices and product details are loaded from the VisionCartAI catalogue.
          Product images use a placeholder when no image is available.
        </p>

        <div className="mt-8 flex justify-center">
          <a
            href="/shop"
            className="inline-flex items-center gap-5 border border-[#30332c] px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:bg-[#30332c] hover:text-white"
          >
            Discover all clothing <span>↗</span>
          </a>
        </div>
      </section>

      {/* Brand benefits */}
      <section className="border-y border-[#e5e3d9] bg-[#f1f0e9]">
        <div className="mx-auto grid max-w-[1600px] gap-7 px-5 py-9 sm:grid-cols-3 sm:px-8 sm:py-12 lg:px-12">
          <Benefit
            number="01"
            title="Your style, first"
            text="Explore clothing that feels like you, not everybody else."
          />
          <Benefit
            number="02"
            title="Budget with intention"
            text="Make considered choices around the amount you want to spend."
          />
          <Benefit
            number="03"
            title="AI, made personal"
            text="Discover clothing combinations with a little help from AI."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#30332c] px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto grid max-w-[1600px] gap-10 sm:grid-cols-2 lg:px-4">
          <div>
            <Link href="/" className="text-2xl font-medium tracking-[-0.04em]">
              VisionCart
              <span className="ml-1 font-serif italic text-[#cbd1bd]">AI</span>
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-6 text-white/60">
              A more thoughtful way to discover clothing, explore your personal
              style and build outfits around your life.
            </p>
            <a
              href="/ai-lab"
              className="mt-5 inline-flex items-center gap-3 border-b border-white/35 pb-1.5 text-xs text-white/80 transition hover:text-white"
            >
              Find your style with AI <span>↗</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:justify-items-end">
            <div className="flex flex-col items-start gap-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
                COLLECTION
              </p>
              <a href="/shop" className="text-xs text-white/75 hover:text-white">
                All clothing
              </a>
              <a href="/women" className="text-xs text-white/75 hover:text-white">
                Women
              </a>
              <a href="/men" className="text-xs text-white/75 hover:text-white">
                Men
              </a>
              <a href="/shop?category=Dresses" className="text-xs text-white/75 hover:text-white">
                Dresses
              </a>
            </div>

            <div className="flex flex-col items-start gap-4 sm:justify-self-end">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
                VISIONCART
              </p>
              <a href="/ai-lab" className="text-xs text-white/75 hover:text-white">
                AI shopping
              </a>
              <a href="/login" data-require-customer-auth data-auth-destination="/" className="text-xs text-white/75 hover:text-white">
                My account
              </a>
              <a href="/shop" className="text-xs text-white/75 hover:text-white">
                Shop collection
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-[1600px] flex-col justify-between gap-3 border-t border-white/15 pt-5 text-[10px] text-white/45 sm:flex-row lg:mx-4">
          <p>© 2026 VisionCartAI. All rights reserved.</p>
          <p>Made for your kind of style.</p>
        </div>
      </footer>
    </main>
  );
}

function Benefit({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border-t border-[#d9d9cd] pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-[9px] tracking-[0.12em] text-[#858579]">
          {number}
        </span>
      </div>
      <p className="mt-3 max-w-sm text-xs leading-6 text-[#6f7166]">{text}</p>
    </div>
  );
}
