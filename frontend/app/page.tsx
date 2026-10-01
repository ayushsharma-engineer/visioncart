import Navbar from "@/components/Navbar";

const categories = [
  { name: "Women", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=500&q=80" },
  { name: "Men", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=500&q=80" },
  { name: "Shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80" },
  { name: "Bags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80" },
  { name: "Beauty", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80" },
  { name: "Sports", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=500&q=80" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=500&q=80" },
  { name: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80" },
  { name: "Home & Living", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80" },
  { name: "Kids", image: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?auto=format&fit=crop&w=500&q=80" },
];

const products = [
  {
    name: "Floral Summer Dress",
    category: "Women · Fashion",
    price: "₹1,599",
    oldPrice: "₹2,499",
    rating: "4.7",
    reviews: "2.1k",
    discount: "36% off",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Running Shoes",
    category: "Sports · Running",
    price: "₹3,999",
    oldPrice: "₹5,999",
    rating: "4.6",
    reviews: "3.4k",
    discount: "33% off",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Travel Laptop Backpack",
    category: "Bags · Travel",
    price: "₹2,199",
    oldPrice: "₹3,499",
    rating: "4.5",
    reviews: "1.2k",
    discount: "37% off",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Fossil Analog Watch",
    category: "Accessories · Watches",
    price: "₹4,499",
    oldPrice: "₹6,999",
    rating: "4.4",
    reviews: "980",
    discount: "36% off",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Classic Sunglasses",
    category: "Accessories",
    price: "₹6,299",
    oldPrice: "₹8,499",
    rating: "4.7",
    reviews: "2.8k",
    discount: "26% off",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Minimalist Face Serum",
    category: "Beauty · Skincare",
    price: "₹599",
    oldPrice: "₹899",
    rating: "4.6",
    reviews: "1.1k",
    discount: "33% off",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Men's Casual Shirt",
    category: "Men · Fashion",
    price: "₹1,299",
    oldPrice: "₹1,999",
    rating: "4.5",
    reviews: "2.3k",
    discount: "35% off",
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Leather Handbag",
    category: "Women · Accessories",
    price: "₹2,799",
    oldPrice: "₹4,499",
    rating: "4.6",
    reviews: "856",
    discount: "38% off",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-gray-900">

      <Navbar />

      {/* HERO */}
      <section className="px-4 pt-4">
        <div className="relative mx-auto min-h-[470px] max-w-[1440px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-white to-blue-100">

          <div className="relative z-10 flex min-h-[470px] items-center px-7 py-16 sm:px-12 lg:w-[58%] lg:px-16">

            <div className="w-full">

              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                AI-powered shopping
              </p>

              <h1 className="max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                Discover products
                <span className="block">
                  you&apos;ll love.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                Shop from top brands, explore new styles, and get
                AI-powered recommendations tailored to you.
              </p>

              {/* SEARCH */}
              <div className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">

                <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white px-4 shadow-lg shadow-blue-100/50">
                  <span className="mr-3 text-xl text-blue-600">⌕</span>

                  <input
                    type="text"
                    placeholder="Search products, brands, or ask anything..."
                    className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />

                  <button className="hidden text-lg text-blue-500 sm:block">
                    🎙
                  </button>
                </div>

                <button className="h-14 rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
                  Search
                </button>

              </div>

              {/* QUICK SEARCHES */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">

                <span className="text-gray-500">Try:</span>

                {[
                  "Wedding outfit under ₹10,000",
                  "Best running shoes",
                  "Summer clothes",
                  "Complete casual look",
                ].map((item) => (
                  <button
                    key={item}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    {item}
                  </button>
                ))}

              </div>

            </div>
          </div>

          {/* Hero image */}
          <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85"
              alt="Fashion shopping"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-50/20 to-transparent" />

            {/* AI card */}
            <div className="absolute right-8 top-1/2 w-64 -translate-y-1/2 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-2xl backdrop-blur">
              <p className="text-sm font-bold text-gray-900">
                ✦ AI Recommendations
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Personalized for your style
              </p>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-sm font-semibold">
                    ◈ Complete Looks
                  </p>
                  <p className="text-xs text-gray-500">
                    Outfits for every occasion
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    ◇ Smart Comparisons
                  </p>
                  <p className="text-xs text-gray-500">
                    Find the best value
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    ✓ Budget Friendly
                  </p>
                  <p className="text-xs text-gray-500">
                    Options within your budget
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1440px] px-4 py-12">

        <div className="mb-6 flex items-end justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Explore
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Shop by Category
            </h2>
          </div>

          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View all →
          </button>

        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">

          {categories.map((category) => (
            <button
              key={category.name}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >

              <div className="h-32 overflow-hidden bg-gray-100">

                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

              </div>

              <div className="p-3 text-center">
                <p className="text-sm font-semibold">
                  {category.name}
                </p>
              </div>

            </button>
          ))}

        </div>

      </section>

      {/* AI SECTION */}
      <section className="px-4">

        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100">

          <div className="grid items-center gap-8 px-7 py-12 md:grid-cols-[220px_1fr_240px] md:px-12">

            {/* Bot */}
            <div className="hidden md:flex md:justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white text-7xl shadow-xl">
                🤖
              </div>
            </div>

            {/* Content */}
            <div className="text-center md:text-left">

              <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                ✦ Meet VisionCart AI
              </span>

              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                Shop smarter with AI
              </h2>

              <p className="mt-3 max-w-2xl text-gray-600">
                Tell us what you need, your budget, style, occasion or
                preferences. We&apos;ll find and recommend the best products
                for you.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">

                {[
                  "Wedding outfit under ₹10,000",
                  "Best shoes for daily running",
                  "Complete summer look",
                  "Compare these two jackets",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white bg-white px-3 py-2 text-xs text-gray-600 shadow-sm"
                  >
                    {item}
                  </span>
                ))}

              </div>

              <a
                href="/ai-shopping"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Try VisionCart AI →
              </a>

            </div>

            {/* Look cards */}
            <div className="hidden grid-cols-2 gap-3 md:grid">

              <div className="rounded-xl bg-white p-3 shadow-lg">
                <div className="flex h-20 items-center justify-center rounded-lg bg-gray-100 text-4xl">
                  👟
                </div>
                <p className="mt-2 text-xs font-semibold">Shoes</p>
              </div>

              <div className="mt-6 rounded-xl bg-white p-3 shadow-lg">
                <div className="flex h-20 items-center justify-center rounded-lg bg-gray-100 text-4xl">
                  👜
                </div>
                <p className="mt-2 text-xs font-semibold">Bag</p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* DEALS */}
      <section className="mx-auto max-w-[1440px] px-4 py-12">

        <div className="mb-6 flex items-end justify-between">

          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              Top Deals
            </h2>

            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
              Up to 70% Off
            </span>
          </div>

          <button className="text-sm font-semibold text-blue-600">
            View all →
          </button>

        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <DealCard
            title="Fashion Deals"
            discount="Up to 60% Off"
            color="bg-orange-50"
            emoji="👗"
          />

          <DealCard
            title="Sports & Fitness"
            discount="Up to 50% Off"
            color="bg-blue-50"
            emoji="👟"
          />

          <DealCard
            title="Beauty Essentials"
            discount="Up to 40% Off"
            color="bg-green-50"
            emoji="💄"
          />

        </div>

      </section>

      {/* PRODUCTS */}
      <section className="border-y border-gray-200 bg-white">

        <div className="mx-auto max-w-[1440px] px-4 py-12">

          <div className="mb-7 flex items-end justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Recommended for You
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Based on your recent activity and preferences
              </p>
            </div>

            <button className="text-sm font-semibold text-blue-600">
              View all →
            </button>

          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">

            {products.map((product) => (
              <ProductCard
                key={product.name}
                product={product}
              />
            ))}

          </div>

        </div>

      </section>

      {/* TRUST BAR */}
      <section className="bg-white px-4 py-8">

        <div className="mx-auto grid max-w-[1440px] gap-5 rounded-2xl bg-blue-50 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4">

          <TrustItem
            icon="🚚"
            title="Free Delivery"
            text="On orders above ₹499"
          />

          <TrustItem
            icon="◈"
            title="Easy Returns"
            text="7 days return policy"
          />

          <TrustItem
            icon="✓"
            title="Secure Payments"
            text="100% safe & secure"
          />

          <TrustItem
            icon="✦"
            title="AI Shopping Assistant"
            text="Smart. Personal. Helpful."
          />

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-gray-950 px-6 py-10 text-gray-400">

        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row">

          <div>
            <p className="text-xl font-bold text-white">
              Vision<span className="text-blue-500">Cart</span>
            </p>

            <p className="mt-2 text-sm">
              AI-powered shopping for better decisions.
            </p>
          </div>

          <p className="text-sm">
            © 2026 VisionCart. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}


/* --------------------------------
   Product Card
-------------------------------- */

function ProductCard({
  product,
}: {
  product: {
    name: string;
    category: string;
    price: string;
    oldPrice: string;
    rating: string;
    reviews: string;
    discount: string;
    image: string;
  };
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">

      <div className="relative aspect-square overflow-hidden bg-gray-100">

        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <button
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg text-gray-600 shadow"
        >
          ♡
        </button>

      </div>

      <div className="p-3">

        <p className="truncate text-[11px] text-gray-400">
          {product.category}
        </p>

        <h3 className="mt-1 line-clamp-2 min-h-[36px] text-sm font-semibold">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-1 text-xs">
          <span className="text-yellow-500">
            ★
          </span>

          <span className="font-semibold">
            {product.rating}
          </span>

          <span className="text-gray-400">
            ({product.reviews})
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">

          <span className="font-bold">
            {product.price}
          </span>

          <span className="text-[11px] text-gray-400 line-through">
            {product.oldPrice}
          </span>

        </div>

        <p className="mt-1 text-[11px] font-semibold text-green-600">
          {product.discount}
        </p>

      </div>

    </article>
  );
}


/* --------------------------------
   Deal Card
-------------------------------- */

function DealCard({
  title,
  discount,
  color,
  emoji,
}: {
  title: string;
  discount: string;
  color: string;
  emoji: string;
}) {
  return (
    <div
      className={`flex items-center justify-between overflow-hidden rounded-2xl ${color} px-6 py-6`}
    >
      <div>
        <h3 className="text-lg font-bold">
          {title}
        </h3>

        <p className="mt-1 font-semibold text-gray-700">
          {discount}
        </p>

        <button className="mt-5 text-sm font-bold">
          Shop Now →
        </button>
      </div>

      <div className="text-7xl">
        {emoji}
      </div>
    </div>
  );
}


/* --------------------------------
   Trust Item
-------------------------------- */

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-blue-600 shadow-sm">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-gray-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {text}
        </p>
      </div>

    </div>
  );
}