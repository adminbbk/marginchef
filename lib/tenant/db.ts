import { prisma } from "@/lib/db";
import { scopeArgs } from "./scope";

/**
 * A Prisma client whose every model query is scoped to one outlet.
 * Non-tenant models (User, Organization, Outlet, Membership…) throw; read
 * those through the getTenant() context instead.
 *
 * Raw SQL ($queryRaw, $executeRaw) is NOT scoped. Do not use it in app code.
 */
export function tenantDb(outletId: string) {
  return prisma.$extends({
    name: "tenant-guard",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // scopeArgs returns a plain record; Prisma's per-operation arg type
          // can't be expressed generically here, hence the cast.
          return query(scopeArgs(model, operation, args, outletId) as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;
