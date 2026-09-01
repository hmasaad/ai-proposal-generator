import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "unpdf", "docx"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
