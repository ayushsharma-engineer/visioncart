export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-5 px-5 lg:px-8">

        <a
          href="/"
          className="shrink-0 text-[25px] font-bold tracking-tight text-gray-950"
        >
          Vision<span className="text-blue-600">Cart</span>
        </a>

        <button className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:flex">
          <span>☷</span>
          Categories
        </button>

        <div className="relative hidden flex-1 md:block">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search for products, brands or ask VisionCart AI..."
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        <nav className="hidden items-center gap-5 lg:flex">
          <a
            href="/deals"
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Deals
          </a>

          <a
            href="/ai-shopping"
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
          >
            ✦ AI Assistant
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">

          <button
            aria-label="Wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            ♡
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
              3
            </span>
          </button>

          <a
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            🛒
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
              2
            </span>
          </a>

          <a
            href="/login"
            className="ml-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
}