import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress "Critical dependency: the request of a dependency is an expression"
  // warnings from Prisma's dynamic require() calls during the webpack build.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
