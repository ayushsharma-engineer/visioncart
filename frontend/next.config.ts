import type { NextConfig } from "next";

/**
 * The FastAPI backend has no CORS middleware, so the browser cannot call it
 * cross-origin. Instead the browser talks to this app at /backend/* and Next.js
 * forwards the request server-side. The backend is left untouched.
 *
 * BACKEND_URL is read when the config loads (dev start / build), so changing it
 * requires restarting `next dev` or rebuilding.
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
