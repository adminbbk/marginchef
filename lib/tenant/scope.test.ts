import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TENANT_MODELS, TenantViolationError, scopeArgs } from "./scope";

const A = "outlet_a";

describe("scopeArgs", () => {
  it.each([
    "findUnique",
    "findUniqueOrThrow",
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
    "delete",
    "deleteMany",
  ])("adds outletId to where for %s", (op) => {
    expect(scopeArgs("Ingredient", op, { where: { name: "Tomato" } }, A)).toEqual({
      where: { name: "Tomato", outletId: A },
    });
  });

  it("adds a where when none is given", () => {
    expect(scopeArgs("Order", "findMany", undefined, A)).toEqual({ where: { outletId: A } });
  });

  it("overrides a caller-supplied outletId filter so scope cannot be widened", () => {
    const args = { where: { outletId: { in: [A, "outlet_b"] } } };
    expect(scopeArgs("Order", "findMany", args, A)).toEqual({ where: { outletId: A } });
  });

  it("keeps OR filters inside the outlet scope", () => {
    const args = { where: { OR: [{ name: "a" }, { name: "b" }] } };
    expect(scopeArgs("Recipe", "findMany", args, A).where).toEqual({
      OR: [{ name: "a" }, { name: "b" }],
      outletId: A,
    });
  });

  it("does not mutate the caller's args", () => {
    const args = { where: { id: "x" } };
    scopeArgs("Recipe", "findUnique", args, A);
    expect(args).toEqual({ where: { id: "x" } });
  });

  it("stamps outletId on create", () => {
    expect(scopeArgs("Supplier", "create", { data: { name: "Al Ain Farms" } }, A)).toEqual({
      data: { name: "Al Ain Farms", outletId: A },
    });
  });

  it("stamps every row on createMany and createManyAndReturn", () => {
    for (const op of ["createMany", "createManyAndReturn"]) {
      const out = scopeArgs("Supplier", op, { data: [{ name: "x" }, { name: "y" }] }, A);
      expect(out.data).toEqual([
        { name: "x", outletId: A },
        { name: "y", outletId: A },
      ]);
    }
  });

  it("refuses to create a row for another outlet", () => {
    expect(() =>
      scopeArgs("Supplier", "create", { data: { name: "x", outletId: "outlet_b" } }, A),
    ).toThrow(TenantViolationError);
    expect(() =>
      scopeArgs("Supplier", "createMany", { data: [{ name: "x", outletId: "outlet_b" }] }, A),
    ).toThrow(TenantViolationError);
  });

  it("refuses the outlet relation in create data", () => {
    const data = { name: "x", outlet: { connect: { id: "outlet_b" } } };
    expect(() => scopeArgs("Supplier", "create", { data }, A)).toThrow(TenantViolationError);
  });

  it("scopes updates and refuses moving rows between outlets", () => {
    expect(
      scopeArgs("Ingredient", "update", { where: { id: "i1" }, data: { name: "x" } }, A),
    ).toEqual({
      where: { id: "i1", outletId: A },
      data: { name: "x" },
    });
    for (const op of ["update", "updateMany", "updateManyAndReturn"]) {
      expect(() =>
        scopeArgs("Ingredient", op, { where: {}, data: { outletId: "outlet_b" } }, A),
      ).toThrow(TenantViolationError);
    }
  });

  it("scopes upsert where, stamps create and guards update", () => {
    const out = scopeArgs(
      "Channel",
      "upsert",
      { where: { id: "c1" }, create: { type: "TALABAT" }, update: { commissionPct: 28 } },
      A,
    );
    expect(out).toEqual({
      where: { id: "c1", outletId: A },
      create: { type: "TALABAT", outletId: A },
      update: { commissionPct: 28 },
    });
    expect(() =>
      scopeArgs(
        "Channel",
        "upsert",
        { where: { id: "c1" }, create: {}, update: { outletId: "b" } },
        A,
      ),
    ).toThrow(TenantViolationError);
  });

  it("fails closed on non-tenant models, unknown operations and missing outletId", () => {
    expect(() => scopeArgs("User", "findMany", {}, A)).toThrow(TenantViolationError);
    expect(() => scopeArgs("Outlet", "findMany", {}, A)).toThrow(TenantViolationError);
    expect(() => scopeArgs("Ingredient", "somethingNew", {}, A)).toThrow(TenantViolationError);
    expect(() => scopeArgs("Ingredient", "findMany", {}, "")).toThrow(TenantViolationError);
  });
});

describe("TENANT_MODELS matches the Prisma schema", () => {
  const schema = readFileSync(path.join(__dirname, "../../prisma/schema.prisma"), "utf8");
  const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map(([, name, body]) => ({
    name: name!,
    hasOutletId: /^\s+outletId\s+String\b/m.test(body!),
  }));
  // Tables that are deliberately not outlet-scoped.
  const NOT_SCOPED = [
    "User",
    "Account",
    "Session",
    "VerificationToken",
    "Organization",
    "Outlet",
    "Membership",
  ];

  it("every model with an outletId column is guarded", () => {
    const withOutlet = models.filter((m) => m.hasOutletId).map((m) => m.name);
    expect([...withOutlet].sort()).toEqual([...TENANT_MODELS].sort());
  });

  it("every other model is on the explicit not-scoped list", () => {
    const without = models.filter((m) => !m.hasOutletId).map((m) => m.name);
    expect([...without].sort()).toEqual([...NOT_SCOPED].sort());
  });
});
