import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@stackframe/stack"],
  // Turbopack is the default bundler in Next.js 16.
  // resolveAlias ensures a single React instance across all packages
  // (fixes Stack Auth ESM + React 19 named import warning).
  turbopack: {
    resolveAlias: {
      react: "./node_modules/react",
      "react-dom": "./node_modules/react-dom",
    },
  },
};

export default nextConfig;
