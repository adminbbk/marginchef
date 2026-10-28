import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // Locally `prisma dev` is a single-connection Postgres that breaks under
  // parallel sessions; CI uses a real Postgres service and runs in parallel.
  workers: process.env.CI ? undefined : 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    // Owners use phones in the kitchen: 380 px wide is the primary target.
    {
      name: "phone-380",
      use: { ...devices["Desktop Chrome"], viewport: { width: 380, height: 800 } },
    },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
