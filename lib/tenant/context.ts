import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tenantDb } from "./db";
import { provisionWorkspace } from "./provision";

export const OUTLET_COOKIE = "mc_outlet";

/**
 * The signed-in user's workspace for this request: user, role, organisation,
 * current outlet, and a database client scoped to that outlet.
 * Redirects to /login when signed out. Creates the workspace on first login.
 *
 * Use in Server Components, Server Actions and Route Handlers:
 *   const { db, outlet } = await getTenant();
 *   const ingredients = await db.ingredient.findMany();
 */
export const getTenant = cache(async () => {
  const user = (await auth())?.user;
  const userId = user?.id;
  if (!user || !userId) redirect("/login");

  const membershipQuery = {
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { org: { include: { outlets: { orderBy: { createdAt: "asc" } } } } },
  } as const;

  let membership = await prisma.membership.findFirst(membershipQuery);
  if (!membership) {
    await provisionWorkspace(userId);
    membership = await prisma.membership.findFirst(membershipQuery);
  }
  if (!membership) throw new Error("Workspace provisioning failed");

  const { outlets, ...org } = membership.org;
  // The cookie is only a preference; it must name an outlet of this org.
  const preferred = (await cookies()).get(OUTLET_COOKIE)?.value;
  const outlet = outlets.find((o) => o.id === preferred) ?? outlets[0];
  if (!outlet) throw new Error(`Organization ${org.id} has no outlets`);

  return {
    userId,
    user,
    role: membership.role,
    org,
    outlets,
    outlet,
    db: tenantDb(outlet.id),
  };
});

export type Tenant = Awaited<ReturnType<typeof getTenant>>;
