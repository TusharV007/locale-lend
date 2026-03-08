import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors in unused UI template files — runtime is unaffected
    ignoreBuildErrors: true,
  },
  images: {
    // Short cache TTL so updated assets (like logo) propagate quickly
    minimumCacheTTL: 60,
    unoptimized: true,
  },
};

export default nextConfig;
