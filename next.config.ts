import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Transpile Stack Auth ESM package for React 19 compatibility
  transpilePackages: ["@stackframe/stack"],
  // Ensure all packages use the same React instance (fixes ESM named import warning)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    };
    return config;
  },
};

export default nextConfig;
