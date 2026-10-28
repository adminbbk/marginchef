import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { tenantDb } from "@/lib/tenant/db";
import { TENANT_MODELS, TenantViolationError, type TenantModel } from "@/lib/tenant/scope";
import { createOutletWithOneOfEverything, type OutletFixture } from "./fixtures";

// The common subset of Prisma model delegates used below. Each delegate has
// model-specific arg types, so generic access needs this narrow structural type.
type Delegate = {
  findMany(args?: object): Promise<{ id: string; outletId: string }[]>;
  findUnique(args: object): Promise<unknown>;
  findFirst(args?: object): Promise<unknown>;
  count(args?: object): Promise<number>;
  update(args: object): Promise<unknown>;
  updateMany(args: object): Promise<{ count: number }>;
  delete(args: object): Promise<unknown>;
  deleteMany(args: object): Promise<{ count: number }>;
};

function delegate(client: object, model: TenantModel): Delegate {
  const key = model[0]!.toLowerCase() + model.slice(1);
  return (client as Record<string, Delegate>)[key]!;
}

let a: OutletFixture;
let b: OutletFixture;

beforeAll(async () => {
  a = await createOutletWithOneOfEverything("A");
  b = await createOutletWithOneOfEverything("B");
});

afterAll(async () => {
  await prisma.organization.deleteMany({
    where: { id: { in: [a?.orgId, b?.orgId].filter(Boolean) } },
  });
  await prisma.$disconnect();
});

describe("tenant isolation: outlet A cannot read or change outlet B's data", () => {
  describe.each(TENANT_MODELS)("%s", (model) => {
    it("findMany and count return only A's rows", async () => {
      const db = tenantDb(a.outletId);
      const rows = await delegate(db, model).findMany();
      expect(rows.map((r) => r.id)).toEqual([a.ids[model]]);
      expect(rows.every((r) => r.outletId === a.outletId)).toBe(true);
      expect(await delegate(db, model).count()).toBe(1);
    });

    it("findUnique / findFirst by B's id return null", async () => {
      const db = tenantDb(a.outletId);
      expect(await delegate(db, model).findUnique({ where: { id: b.ids[model] } })).toBeNull();
      expect(await delegate(db, model).findFirst({ where: { id: b.ids[model] } })).toBeNull();
    });

    it("a widened outletId filter still returns only A's rows", async () => {
      const db = tenantDb(a.outletId);
      const rows = await delegate(db, model).findMany({
        where: { outletId: { in: [a.outletId, b.outletId] } },
      });
      expect(rows.map((r) => r.id)).toEqual([a.ids[model]]);
    });

    it("update / delete of B's row fail and leave it untouched", async () => {
      const db = tenantDb(a.outletId);
      const where = { id: b.ids[model] };
      await expect(delegate(db, model).update({ where, data: {} })).rejects.toThrow();
      expect((await delegate(db, model).updateMany({ where, data: {} })).count).toBe(0);
      await expect(delegate(db, model).delete({ where })).rejects.toThrow();
      expect((await delegate(db, model).deleteMany({ where })).count).toBe(0);
      expect(await delegate(prisma, model).findUnique({ where })).not.toBeNull();
    });
  });

  it("nested includes only reach A's rows", async () => {
    const recipes = await tenantDb(a.outletId).recipe.findMany({
      include: {
        lines: { include: { ingredient: true } },
        menuItems: { include: { prices: true } },
      },
    });
    expect(recipes).toHaveLength(1);
    const ingredientOutlets = recipes.flatMap((r) => r.lines.map((l) => l.ingredient?.outletId));
    const priceOutlets = recipes.flatMap((r) =>
      r.menuItems.flatMap((m) => m.prices.map((p) => p.outletId)),
    );
    expect([...ingredientOutlets, ...priceOutlets].every((id) => id === a.outletId)).toBe(true);
  });

  it("interactive transactions stay scoped", async () => {
    const ids = await tenantDb(a.outletId).$transaction(async (tx) =>
      (await tx.ingredient.findMany()).map((i) => i.id),
    );
    expect(ids).toEqual([a.ids.Ingredient]);
  });

  it("creating a row for another outlet is refused", async () => {
    await expect(
      tenantDb(a.outletId).supplier.create({ data: { name: "Sneaky", outletId: b.outletId } }),
    ).rejects.toThrow(TenantViolationError);
  });

  it("the database refuses a row in A that points at B's data", async () => {
    // Bypass the guard entirely: the composite foreign key must still hold.
    await expect(
      prisma.recipeLine.create({
        data: {
          outletId: a.outletId,
          recipeId: a.ids.Recipe,
          ingredientId: b.ids.Ingredient,
          qty: 10,
          unit: "g",
        },
      }),
    ).rejects.toThrow();
    // Through the guard as well.
    await expect(
      tenantDb(a.outletId).channelPrice.create({
        data: {
          outletId: a.outletId,
          menuItemId: a.ids.MenuItem,
          channelId: b.ids.Channel,
          priceFils: 1,
        },
      }),
    ).rejects.toThrow();
  });

  it("non-tenant models are not reachable through the tenant client", async () => {
    const db = tenantDb(a.outletId);
    await expect(db.outlet.findMany()).rejects.toThrow(TenantViolationError);
    await expect(db.user.findMany()).rejects.toThrow(TenantViolationError);
    await expect(db.membership.findMany()).rejects.toThrow(TenantViolationError);
  });
});
