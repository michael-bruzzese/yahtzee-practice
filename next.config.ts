import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack root to this project to avoid multi-lockfile warnings.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
