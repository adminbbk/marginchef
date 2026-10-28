import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** A URL-safe slug with a random suffix, e.g. "sunset-cafe-3fa9c1". */
export function uniqueSlug(name: string): string {
  const base = slugify(name) || "outlet";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/**
 * Creates Organization + Outlet + OWNER Membership for a user on first login.
 * Idempotent and safe under concurrent requests: an advisory lock per user
 * serialises callers, and the membership check runs inside the lock.
 * The onboarding wizard (phase 3) renames the org and outlet.
 */
export async function provisionWorkspace(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const existing = await tx.membership.findFirst({ where: { userId } });
    if (existing) return existing;

    const org = await tx.organization.create({ data: { name: "My restaurant" } });
    await tx.outlet.create({
      data: { orgId: org.id, name: "Main outlet", slug: uniqueSlug("outlet") },
    });
    return tx.membership.create({ data: { userId, orgId: org.id, role: "OWNER" } });
  });
}
