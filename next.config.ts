import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "*.supabase.co" },
      { hostname: "*.b-cdn.net" },
    ],
  },
};

export default nextConfig;
