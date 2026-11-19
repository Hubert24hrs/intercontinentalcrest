import type { NextConfig } from "next";
import path from "node:path";

/**
 * The browser only ever talks to this site's own origin: /api/* is proxied to
 * the NestJS backend. That keeps auth cookies first-party (httpOnly, SameSite=Lax),
 * so nothing sensitive needs to live in localStorage and iOS/Safari tracking
 * protection can't break sessions.
 *
 * BACKEND_URL (server-side only) overrides the backend origin, e.g.
 * BACKEND_URL=https://intercontinentalcrest-backend.vercel.app
 */
const PRODUCTION_BACKEND = "https://intercontinentalcrest-backend.vercel.app";

function backendOrigin(): string {
  const raw = (process.env.BACKEND_URL || "").trim();
  const fallback = process.env.NODE_ENV === "production" ? PRODUCTION_BACKEND : "http://localhost:4000";
  return (raw || fallback).replace(/\/+$/, "").replace(/\/api$/, "");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://images.unsplash.com https://coin-images.coingecko.com https://assets.coingecko.com",
      "connect-src 'self'" + (process.env.NODE_ENV === "production" ? "" : " ws://localhost:* http://localhost:*"),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // Pin the project root: a stray lockfile higher up the tree otherwise makes Turbopack watch the wrong folder.
  turbopack: { root: path.resolve(__dirname) },
  experimental: {
    // NEXT_DEV_FS_CACHE=0 stops `next dev` persisting its Turbopack cache to disk (handy on low-disk machines).
    turbopackFileSystemCacheForDev: process.env.NEXT_DEV_FS_CACHE !== "0",
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
    ],
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendOrigin()}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
