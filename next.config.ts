import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((origin) => origin.trim())
    : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // better-sqlite3 is a native module: it must stay external to the server
  // bundle, otherwise the .node binding is not resolvable at runtime.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
