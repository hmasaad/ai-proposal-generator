import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "unpdf"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
