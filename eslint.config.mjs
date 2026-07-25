import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Production deployment refresh: 2026-07-25.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/lib/english-beginner-data/part-*.ts"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
