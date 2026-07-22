import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Veri yükleyen useEffect + setState kalıpları staj projesinde yaygın;
      // React Compiler’ın bu kuralı false-positive üretiyor.
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
