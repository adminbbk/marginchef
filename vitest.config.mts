import { defineConfig } from "vitest/config";

// Unit tests: pure code, no database.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "tests/integration/**", "e2e/**", ".next/**"],
    coverage: { provider: "v8", include: ["lib/**"], exclude: ["lib/generated/**"] },
  },
});
