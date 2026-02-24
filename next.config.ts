import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Transpile Stack Auth ESM packages to avoid React 19 import compatibility issues
  transpilePackages: ["@stackframe/stack", "@stackframe/stack-shared", "@stackframe/stack-sc"],
};

export default nextConfig;
