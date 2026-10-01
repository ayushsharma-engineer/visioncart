"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT SIDE */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 lg:flex">

          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* LOGO */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-white"
            >
              Vision<span className="text-blue-200">Cart</span>
            </Link>

            {/* CONTENT */}
            <div className="max-w-lg">

              <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-blue-50 backdrop-blur">
                ✦ AI-powered shopping
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Shopping that
                <br />
                understands you.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
                Discover products, compare options and get personalized
                recommendations with VisionCart AI.
              </p>

              {/* FEATURES */}
              <div className="mt-10 space-y-5">

                <Feature
                  title="Personalized recommendations"
                  text="Products selected around your preferences."
                />

                <Feature
                  title="Smart budget planning"
                  text="Find the right products without overspending."
                />

                <Feature
                  title="Complete outfit discovery"
                  text="Build compatible looks for every occasion."
                />

              </div>

            </div>

            {/* FOOTER */}
            <p className="text-sm text-blue-200">
              © 2026 VisionCart. All rights reserved.
            </p>

          </div>
        </section>


        {/* RIGHT SIDE */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <div className="mb-10 lg:hidden">

              <Link
                href="/"
                className="text-2xl font-bold tracking-tight text-gray-950"
              >
                Vision<span className="text-blue-600">Cart</span>
              </Link>

            </div>


            {/* HEADING */}
            <div>

              <h2 className="text-3xl font-bold tracking-tight text-gray-950">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in to continue shopping with VisionCart.
              </p>

            </div>


            {/* LOGIN FORM */}
            <form className="mt-8 space-y-5">

              {/* EMAIL / MOBILE */}
              <div>

                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Email or mobile number
                </label>

                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or mobile number"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

              </div>


              {/* PASSWORD */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-800"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </Link>

                </div>


                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-20 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs font-semibold text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>


              {/* REMEMBER ME */}
              <div className="flex items-center gap-2">

                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600"
                >
                  Remember me
                </label>

              </div>


              {/* SIGN IN */}
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-[0.99]"
              >
                Sign in
              </button>

            </form>


            {/* DIVIDER */}
            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-gray-200" />

              <span className="text-xs text-gray-400">
                OR
              </span>

              <div className="h-px flex-1 bg-gray-200" />

            </div>


            {/* GOOGLE LOGIN */}
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >

              <span className="text-base font-bold text-blue-600">
                G
              </span>

              Continue with Google

            </button>


            {/* REGISTER */}
            <p className="mt-8 text-center text-sm text-gray-500">

              Don&apos;t have an account?{" "}

              <Link
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create account
              </Link>

            </p>


            {/* SECURITY */}
            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">

              <p className="text-xs text-gray-500">
                🔒 Your account information is securely protected.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}


/* FEATURE COMPONENT */

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm text-white ring-1 ring-white/10">
        ✓
      </div>

      <div>

        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-blue-100">
          {text}
        </p>

      </div>

    </div>
  );
}