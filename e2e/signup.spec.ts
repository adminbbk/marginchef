import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { outboxFile } from "../lib/auth/dev-mailer";

async function readMagicLink(email: string): Promise<string> {
  const file = outboxFile(email);
  for (let i = 0; i < 50; i++) {
    try {
      return (await readFile(file, "utf8")).trim();
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`No magic link written to ${file}`);
}

test("signed-out visitors are sent to /login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("a new user signs up with a magic link and lands on an empty /app", async ({ page }, info) => {
  const email = `e2e-${info.project.name}-${Date.now()}@marginchef.test`;

  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  await page.goto(await readMagicLink(email));
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId("outlet-name")).toHaveText("Main outlet");
  await expect(page.getByTestId("empty-dashboard")).toBeVisible();

  // No horizontal scroll at phone width.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
