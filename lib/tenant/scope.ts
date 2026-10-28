/**
 * Pure argument rewriting for the tenant guard. Kept free of Prisma imports
 * so it can be unit-tested without a database.
 *
 * Every model listed in TENANT_MODELS has an `outletId` column. The guard:
 * - adds `outletId` to every `where` (reads, updates, deletes, aggregates),
 * - stamps `outletId` on every create, and refuses a different one,
 * - refuses any attempt to move a row to another outlet,
 * - fails closed: unknown operations and non-tenant models throw.
 *
 * Child rows reference parents through composite (id, outletId) foreign keys,
 * so relation `include`/`select` can never reach another outlet's rows.
 */

export const TENANT_MODELS = [
  "Supplier",
  "Ingredient",
  "IngredientPrice",
  "Invoice",
  "InvoiceLine",
  "Recipe",
  "RecipeLine",
  "Channel",
  "MenuItem",
  "ChannelPrice",
  "Order",
  "OrderItem",
  "PayoutImport",
] as const;

export type TenantModel = (typeof TENANT_MODELS)[number];

const tenantModelSet: ReadonlySet<string> = new Set(TENANT_MODELS);

export function isTenantModel(model: string): model is TenantModel {
  return tenantModelSet.has(model);
}

export class TenantViolationError extends Error {
  constructor(message: string) {
    super(`Tenant guard: ${message}`);
    this.name = "TenantViolationError";
  }
}

const WHERE_OPS = new Set([
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
]);
const UPDATE_OPS = new Set(["update", "updateMany", "updateManyAndReturn"]);
const CREATE_OPS = new Set(["create"]);
const CREATE_MANY_OPS = new Set(["createMany", "createManyAndReturn"]);

// Prisma hands extensions loosely typed args; we only touch a few keys.
type Args = Record<string, unknown>;
type Row = Record<string, unknown>;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scopeWhere(where: unknown, outletId: string): Row {
  if (where !== undefined && !isRecord(where)) {
    throw new TenantViolationError("`where` must be an object");
  }
  // outletId goes last so a caller-supplied value can never widen the scope.
  return { ...(where ?? {}), outletId };
}

function stampCreate(model: string, data: unknown, outletId: string): Row {
  if (!isRecord(data)) {
    throw new TenantViolationError(`${model} create data must be an object`);
  }
  if ("outlet" in data) {
    throw new TenantViolationError(
      `${model}: set outletId via the tenant client, not the \`outlet\` relation`,
    );
  }
  if (data.outletId !== undefined && data.outletId !== outletId) {
    throw new TenantViolationError(`${model}: cannot create a row for another outlet`);
  }
  return { ...data, outletId };
}

function checkUpdate(model: string, data: unknown): void {
  if (!isRecord(data)) return;
  if ("outletId" in data || "outlet" in data) {
    throw new TenantViolationError(`${model}: outletId cannot be changed`);
  }
}

/** Returns new args scoped to `outletId`, or throws TenantViolationError. */
export function scopeArgs(model: string, operation: string, args: unknown, outletId: string): Args {
  if (!outletId) throw new TenantViolationError("missing outletId");
  if (!isTenantModel(model)) {
    throw new TenantViolationError(
      `${model} is not outlet-scoped; use getTenant() context or the outlet helpers`,
    );
  }
  const a: Args = isRecord(args) ? { ...args } : {};

  if (WHERE_OPS.has(operation)) {
    a.where = scopeWhere(a.where, outletId);
    return a;
  }
  if (UPDATE_OPS.has(operation)) {
    checkUpdate(model, a.data);
    a.where = scopeWhere(a.where, outletId);
    return a;
  }
  if (CREATE_OPS.has(operation)) {
    a.data = stampCreate(model, a.data, outletId);
    return a;
  }
  if (CREATE_MANY_OPS.has(operation)) {
    const rows = Array.isArray(a.data) ? a.data : [a.data];
    a.data = rows.map((row) => stampCreate(model, row, outletId));
    return a;
  }
  if (operation === "upsert") {
    checkUpdate(model, a.update);
    a.where = scopeWhere(a.where, outletId);
    a.create = stampCreate(model, a.create, outletId);
    return a;
  }
  throw new TenantViolationError(`operation ${operation} on ${model} is not allowed`);
}
