import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root (a stray package-lock.json in the home folder confuses detection).
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
