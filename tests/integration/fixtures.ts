import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/tenant/provision";
import type { TenantModel } from "@/lib/tenant/scope";

export type OutletFixture = {
  orgId: string;
  outletId: string;
  ids: Record<TenantModel, string>;
};

/** Creates an org + outlet with exactly one row in every outlet-scoped table. */
export async function createOutletWithOneOfEverything(label: string): Promise<OutletFixture> {
  const org = await prisma.organization.create({ data: { name: `Isolation ${label}` } });
  const outlet = await prisma.outlet.create({
    data: { orgId: org.id, name: `Outlet ${label}`, slug: uniqueSlug(`iso-${label}`) },
  });
  const outletId = outlet.id;

  const supplier = await prisma.supplier.create({ data: { outletId, name: `Supplier ${label}` } });
  const ingredient = await prisma.ingredient.create({
    data: { outletId, name: `Tomato ${label}`, baseUnit: "g" },
  });
  const invoice = await prisma.invoice.create({
    data: { outletId, supplierId: supplier.id, source: "PHOTO" },
  });
  const invoiceLine = await prisma.invoiceLine.create({
    data: {
      outletId,
      invoiceId: invoice.id,
      description: "TOMATO LOOSE KG",
      qty: 5,
      unit: "kg",
      unitPriceFils: 450,
      ingredientId: ingredient.id,
    },
  });
  const ingredientPrice = await prisma.ingredientPrice.create({
    data: {
      outletId,
      ingredientId: ingredient.id,
      supplierId: supplier.id,
      invoiceLineId: invoiceLine.id,
      packQty: 5,
      packUnit: "kg",
      packPriceFils: 2250,
      effectiveAt: new Date(),
    },
  });
  const recipe = await prisma.recipe.create({ data: { outletId, name: `Salad ${label}` } });
  const recipeLine = await prisma.recipeLine.create({
    data: { outletId, recipeId: recipe.id, ingredientId: ingredient.id, qty: 120, unit: "g" },
  });
  const channel = await prisma.channel.create({
    data: { outletId, type: "TALABAT", commissionPct: 28 },
  });
  const menuItem = await prisma.menuItem.create({
    data: { outletId, recipeId: recipe.id, name: `Salad ${label}` },
  });
  const channelPrice = await prisma.channelPrice.create({
    data: { outletId, menuItemId: menuItem.id, channelId: channel.id, priceFils: 3200 },
  });
  const payoutImport = await prisma.payoutImport.create({
    data: {
      outletId,
      channelId: channel.id,
      fileUrl: "blob://statement.csv",
      periodStart: new Date("2026-09-01"),
      periodEnd: new Date("2026-09-30"),
      status: "DONE",
    },
  });
  const order = await prisma.order.create({
    data: {
      outletId,
      channelId: channel.id,
      placedAt: new Date(),
      grossFils: 3200,
      importBatchId: payoutImport.id,
    },
  });
  const orderItem = await prisma.orderItem.create({
    data: {
      outletId,
      orderId: order.id,
      menuItemId: menuItem.id,
      name: menuItem.name,
      qty: 1,
      unitPriceFils: 3200,
    },
  });

  return {
    orgId: org.id,
    outletId,
    ids: {
      Supplier: supplier.id,
      Ingredient: ingredient.id,
      IngredientPrice: ingredientPrice.id,
      Invoice: invoice.id,
      InvoiceLine: invoiceLine.id,
      Recipe: recipe.id,
      RecipeLine: recipeLine.id,
      Channel: channel.id,
      MenuItem: menuItem.id,
      ChannelPrice: channelPrice.id,
      Order: order.id,
      OrderItem: orderItem.id,
      PayoutImport: payoutImport.id,
    },
  };
}
