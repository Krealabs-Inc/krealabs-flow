import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // async data-fetching via useCallback inside useEffect is a valid pattern
      "react-hooks/set-state-in-effect": "off",
      // Date.now() / new Date() in client components is fine
      "react-hooks/purity": "off",
      // warn only — explicit any is sometimes unavoidable with third-party libs
      "@typescript-eslint/no-explicit-any": "warn",
      // French UI text frequently uses apostrophes — escape is not required
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
