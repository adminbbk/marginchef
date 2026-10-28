import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEV_OUTBOX_DIR = path.join(process.cwd(), ".dev-outbox");

export function outboxFile(email: string): string {
  return path.join(DEV_OUTBOX_DIR, `${email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_")}.txt`);
}

/**
 * Development-only stand-in for Resend: writes the magic link to
 * .dev-outbox/<email>.txt and the server log. E2E tests read the file.
 * Never used when NODE_ENV is production.
 */
export async function writeDevMagicLink(email: string, url: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev mailer must not run in production");
  }
  await mkdir(DEV_OUTBOX_DIR, { recursive: true });
  await writeFile(outboxFile(email), url, "utf8");
  console.info(`\n[dev-mailer] Magic link for ${email}:\n${url}\n`);
}
