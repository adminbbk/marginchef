import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Unscoped Prisma client. Do NOT import this from app code: use
 * `getTenant().db` (lib/tenant) so every query is scoped to one outlet.
 * ESLint blocks imports outside lib/tenant, lib/auth, prisma/ and tests.
 */
function createClient() {
  // No eager check on DATABASE_URL so `next build` works without a database;
  // a missing URL fails on the first query instead.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
