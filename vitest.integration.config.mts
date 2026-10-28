import "dotenv/config";
import { defineConfig } from "vitest/config";

// Integration tests: need DATABASE_URL pointing at a migrated, disposable DB.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
