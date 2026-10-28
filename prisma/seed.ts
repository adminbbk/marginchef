/**
 * Demo café: 30 ingredients, 20 dishes (incl. 3 sub-recipes), 3 channels,
 * 60 days of orders. Idempotent: wipes and recreates the demo org.
 *
 *   npm run db:seed
 *
 * Sign in as demo@marginchef.test (magic link lands in .dev-outbox/).
 *
 * Note: Ingredient.currentCostPerBaseUnit is left at 0 here. It is derived by
 * lib/margin (phase 1), and the recalculation job will fill it.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db";
import type { Prisma, Unit } from "../lib/generated/prisma/client";

const ORG_ID = "demo-org";
const OUTLET_ID = "demo-outlet";
const DEMO_EMAIL = "demo@marginchef.test";
const DAYS = 60;

// Deterministic PRNG (mulberry32) so every seed produces the same café.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261003);
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;

// name, base unit, pack qty, pack unit, pack price (fils, ex VAT), yield %, supplier
const INGREDIENTS: [string, Unit, number, Unit, number, number, string][] = [
  ["Tomato", "g", 5, "kg", 2250, 92, "Al Aweer Fresh"],
  ["Lettuce (iceberg)", "g", 1, "kg", 900, 80, "Al Aweer Fresh"],
  ["Red onion", "g", 5, "kg", 1500, 90, "Al Aweer Fresh"],
  ["Avocado", "pc", 12, "pc", 3600, 100, "Al Aweer Fresh"],
  ["Lemon", "pc", 30, "pc", 1800, 100, "Al Aweer Fresh"],
  ["Potato", "g", 10, "kg", 2800, 85, "Al Aweer Fresh"],
  ["Rocket", "g", 1, "kg", 3200, 95, "Al Aweer Fresh"],
  ["Mushroom", "g", 2, "kg", 2400, 95, "Al Aweer Fresh"],
  ["Beef mince 80/20", "g", 5, "kg", 22500, 100, "Emirates Meat Co"],
  ["Chicken breast", "g", 5, "kg", 13500, 95, "Emirates Meat Co"],
  ["Smoked turkey bacon", "g", 1, "kg", 5800, 100, "Emirates Meat Co"],
  ["Halloumi", "g", 1, "kg", 4200, 100, "Gulf Dairy Supplies"],
  ["Cheddar slices", "pc", 84, "pc", 6300, 100, "Gulf Dairy Supplies"],
  ["Mozzarella", "g", 2, "kg", 7400, 100, "Gulf Dairy Supplies"],
  ["Butter", "g", 1, "kg", 3800, 100, "Gulf Dairy Supplies"],
  ["Eggs", "pc", 30, "pc", 1650, 100, "Gulf Dairy Supplies"],
  ["Full-cream milk", "ml", 2, "l", 1050, 100, "Gulf Dairy Supplies"],
  ["Oat milk", "ml", 1, "l", 1400, 100, "Gulf Dairy Supplies"],
  ["Espresso beans", "g", 1, "kg", 9500, 100, "Raw Coffee Roasters"],
  ["Brioche bun", "pc", 24, "pc", 4300, 100, "Bake House DXB"],
  ["Sourdough loaf", "pc", 1, "pc", 1800, 100, "Bake House DXB"],
  ["Flour (00)", "g", 10, "kg", 4500, 100, "Bake House DXB"],
  ["Olive oil", "ml", 5, "l", 9800, 100, "Spinneys Wholesale"],
  ["Mayonnaise", "g", 3.8, "kg", 3900, 100, "Spinneys Wholesale"],
  ["Sriracha", "ml", 0.8, "l", 1600, 100, "Spinneys Wholesale"],
  ["Pickles", "g", 2, "kg", 2100, 100, "Spinneys Wholesale"],
  ["Basmati rice", "g", 5, "kg", 3200, 100, "Spinneys Wholesale"],
  ["Quinoa", "g", 1, "kg", 2600, 100, "Spinneys Wholesale"],
  ["Sugar", "g", 2, "kg", 900, 100, "Spinneys Wholesale"],
  ["Salt", "g", 1, "kg", 250, 100, "Spinneys Wholesale"],
];

type Line = [ingredientOrSub: string, qty: number, unit: Unit];

const SUB_RECIPES: { name: string; portions: number; lines: Line[] }[] = [
  {
    name: "House burger sauce",
    portions: 20, // 20 × 30 g
    lines: [
      ["Mayonnaise", 400, "g"],
      ["Sriracha", 100, "ml"],
      ["Pickles", 100, "g"],
    ],
  },
  {
    name: "Lemon aioli",
    portions: 15,
    lines: [
      ["Mayonnaise", 400, "g"],
      ["Lemon", 2, "pc"],
      ["Olive oil", 50, "ml"],
      ["Salt", 5, "g"],
    ],
  },
  {
    name: "Flatbread dough",
    portions: 8,
    lines: [
      ["Flour (00)", 1000, "g"],
      ["Olive oil", 60, "ml"],
      ["Salt", 20, "g"],
      ["Sugar", 10, "g"],
    ],
  },
];

// name, category, packaging (fils), dine-in price (fils, incl. VAT), lines
const DISHES: [string, string, number, number, Line[]][] = [
  [
    "Classic smash burger",
    "Burgers",
    120,
    4200,
    [
      ["Brioche bun", 1, "pc"],
      ["Beef mince 80/20", 160, "g"],
      ["Cheddar slices", 2, "pc"],
      ["Lettuce (iceberg)", 20, "g"],
      ["Tomato", 30, "g"],
      ["House burger sauce", 1, "pc"],
    ],
  ],
  [
    "Double smash burger",
    "Burgers",
    120,
    5400,
    [
      ["Brioche bun", 1, "pc"],
      ["Beef mince 80/20", 300, "g"],
      ["Cheddar slices", 3, "pc"],
      ["Pickles", 20, "g"],
      ["House burger sauce", 1, "pc"],
    ],
  ],
  [
    "Crispy chicken burger",
    "Burgers",
    120,
    3900,
    [
      ["Brioche bun", 1, "pc"],
      ["Chicken breast", 170, "g"],
      ["Flour (00)", 30, "g"],
      ["Lettuce (iceberg)", 20, "g"],
      ["Lemon aioli", 1, "pc"],
    ],
  ],
  [
    "Halloumi burger",
    "Burgers",
    120,
    3800,
    [
      ["Brioche bun", 1, "pc"],
      ["Halloumi", 120, "g"],
      ["Rocket", 15, "g"],
      ["Tomato", 30, "g"],
      ["Lemon aioli", 1, "pc"],
    ],
  ],
  [
    "Avocado toast",
    "Breakfast",
    90,
    3600,
    [
      ["Sourdough loaf", 0.15, "pc"],
      ["Avocado", 1, "pc"],
      ["Eggs", 1, "pc"],
      ["Lemon", 0.25, "pc"],
      ["Olive oil", 10, "ml"],
    ],
  ],
  [
    "Shakshuka",
    "Breakfast",
    110,
    3400,
    [
      ["Eggs", 2, "pc"],
      ["Tomato", 200, "g"],
      ["Red onion", 50, "g"],
      ["Olive oil", 15, "ml"],
      ["Sourdough loaf", 0.1, "pc"],
    ],
  ],
  [
    "Full breakfast",
    "Breakfast",
    130,
    4800,
    [
      ["Eggs", 2, "pc"],
      ["Smoked turkey bacon", 60, "g"],
      ["Mushroom", 80, "g"],
      ["Tomato", 80, "g"],
      ["Sourdough loaf", 0.1, "pc"],
      ["Butter", 10, "g"],
    ],
  ],
  [
    "Mushroom omelette",
    "Breakfast",
    90,
    3200,
    [
      ["Eggs", 3, "pc"],
      ["Mushroom", 80, "g"],
      ["Mozzarella", 30, "g"],
      ["Butter", 10, "g"],
    ],
  ],
  [
    "Chicken quinoa bowl",
    "Bowls",
    150,
    4400,
    [
      ["Chicken breast", 150, "g"],
      ["Quinoa", 80, "g"],
      ["Avocado", 0.5, "pc"],
      ["Rocket", 20, "g"],
      ["Lemon", 0.25, "pc"],
      ["Olive oil", 10, "ml"],
    ],
  ],
  [
    "Halloumi rice bowl",
    "Bowls",
    150,
    3900,
    [
      ["Halloumi", 100, "g"],
      ["Basmati rice", 100, "g"],
      ["Tomato", 60, "g"],
      ["Red onion", 20, "g"],
      ["Lemon aioli", 1, "pc"],
    ],
  ],
  [
    "Garden salad",
    "Salads",
    110,
    2900,
    [
      ["Lettuce (iceberg)", 80, "g"],
      ["Tomato", 80, "g"],
      ["Red onion", 20, "g"],
      ["Olive oil", 15, "ml"],
      ["Lemon", 0.25, "pc"],
    ],
  ],
  [
    "Rocket & halloumi salad",
    "Salads",
    110,
    3500,
    [
      ["Rocket", 60, "g"],
      ["Halloumi", 80, "g"],
      ["Tomato", 60, "g"],
      ["Olive oil", 15, "ml"],
    ],
  ],
  [
    "Margherita flatbread",
    "Flatbreads",
    140,
    3800,
    [
      ["Flatbread dough", 1, "pc"],
      ["Tomato", 100, "g"],
      ["Mozzarella", 120, "g"],
      ["Olive oil", 10, "ml"],
    ],
  ],
  [
    "Chicken & mushroom flatbread",
    "Flatbreads",
    140,
    4400,
    [
      ["Flatbread dough", 1, "pc"],
      ["Chicken breast", 100, "g"],
      ["Mushroom", 60, "g"],
      ["Mozzarella", 100, "g"],
    ],
  ],
  [
    "Truffle-style fries",
    "Sides",
    80,
    2200,
    [
      ["Potato", 250, "g"],
      ["Olive oil", 20, "ml"],
      ["Salt", 3, "g"],
    ],
  ],
  [
    "Loaded fries",
    "Sides",
    80,
    2800,
    [
      ["Potato", 250, "g"],
      ["Cheddar slices", 2, "pc"],
      ["Smoked turkey bacon", 30, "g"],
      ["House burger sauce", 1, "pc"],
    ],
  ],
  [
    "Flat white",
    "Coffee",
    60,
    1900,
    [
      ["Espresso beans", 18, "g"],
      ["Full-cream milk", 160, "ml"],
    ],
  ],
  [
    "Iced oat latte",
    "Coffee",
    70,
    2300,
    [
      ["Espresso beans", 18, "g"],
      ["Oat milk", 220, "ml"],
      ["Sugar", 10, "g"],
    ],
  ],
  [
    "Cappuccino",
    "Coffee",
    60,
    1800,
    [
      ["Espresso beans", 18, "g"],
      ["Full-cream milk", 150, "ml"],
    ],
  ],
  ["Espresso", "Coffee", 40, 1200, [["Espresso beans", 18, "g"]]],
];

const CHANNELS = [
  // type, commission %, base, fixed fee (fils), payment fee %, price uplift vs dine-in, orders/day
  {
    type: "DINE_IN",
    commissionPct: 0,
    commissionBase: "NET",
    fixedFeeFils: 0,
    paymentFeePct: 2.2,
    uplift: 1,
    perDay: [18, 30],
  },
  {
    type: "TALABAT",
    commissionPct: 28,
    commissionBase: "NET",
    fixedFeeFils: 0,
    paymentFeePct: 0,
    uplift: 1.15,
    perDay: [12, 24],
  },
  {
    type: "DELIVEROO",
    commissionPct: 30,
    commissionBase: "GROSS",
    fixedFeeFils: 100,
    paymentFeePct: 0,
    uplift: 1.18,
    perDay: [5, 14],
  },
] as const;

/** Round up to the nearest AED 0.50 (50 fils) — how menus are actually priced. */
const roundUpToHalfDirham = (fils: number) => Math.ceil(fils / 50) * 50;

async function main() {
  console.log("Seeding demo café…");
  await prisma.organization.deleteMany({ where: { id: ORG_ID } });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo Owner", emailVerified: new Date() },
  });
  await prisma.organization.create({
    data: {
      id: ORG_ID,
      name: "Sunset Bean Hospitality",
      members: { create: { userId: user.id, role: "OWNER" } },
      outlets: {
        create: {
          id: OUTLET_ID,
          name: "Sunset Bean Café — JLT",
          slug: "sunset-bean-jlt",
          whatsappNumber: "+971500000000",
          targetFoodCostPct: 30,
        },
      },
    },
  });
  const outletId = OUTLET_ID;

  // Suppliers
  const supplierNames = [...new Set(INGREDIENTS.map((i) => i[6]))];
  const supplierIds = new Map<string, string>();
  for (const name of supplierNames) {
    const s = await prisma.supplier.create({
      data: { outletId, name, trn: `100${randInt(100000000, 999999999)}003` },
    });
    supplierIds.set(name, s.id);
  }

  // Ingredients + price history (an older price 45 days ago, current price 5 days ago)
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
  const ingredientIds = new Map<string, string>();
  for (const [
    name,
    baseUnit,
    packQty,
    packUnit,
    packPriceFils,
    yieldPct,
    supplier,
  ] of INGREDIENTS) {
    const ing = await prisma.ingredient.create({ data: { outletId, name, baseUnit, yieldPct } });
    ingredientIds.set(name, ing.id);
    const supplierId = supplierIds.get(supplier)!;
    // Tomato jumped ~18% this month; everything else drifted a little.
    const olderPrice =
      name === "Tomato"
        ? Math.round(packPriceFils / 1.18)
        : Math.round(packPriceFils * (0.95 + rand() * 0.05));
    await prisma.ingredientPrice.createMany({
      data: [
        {
          outletId,
          ingredientId: ing.id,
          supplierId,
          packQty,
          packUnit,
          packPriceFils: olderPrice,
          effectiveAt: daysAgo(45),
        },
        {
          outletId,
          ingredientId: ing.id,
          supplierId,
          packQty,
          packUnit,
          packPriceFils,
          effectiveAt: daysAgo(5),
        },
      ],
    });
  }

  // Recipes: sub-recipes first so dishes can reference them
  const recipeIds = new Map<string, string>();
  const lineData = (lines: Line[]) =>
    lines.map(([ref, qty, unit]) => {
      const ingredientId = ingredientIds.get(ref);
      const subRecipeId = recipeIds.get(ref);
      if (!ingredientId && !subRecipeId) throw new Error(`Unknown recipe line: ${ref}`);
      return { outletId, qty, unit, ingredientId, subRecipeId };
    });

  for (const sub of SUB_RECIPES) {
    const r = await prisma.recipe.create({
      data: {
        outletId,
        name: sub.name,
        category: "Prep",
        isSubRecipe: true,
        portions: sub.portions,
      },
    });
    recipeIds.set(sub.name, r.id);
    await prisma.recipeLine.createMany({
      data: lineData(sub.lines).map((l) => ({ ...l, recipeId: r.id })),
    });
  }

  // Channels
  const channels = [];
  for (const c of CHANNELS) {
    const ch = await prisma.channel.create({
      data: {
        outletId,
        type: c.type,
        commissionPct: c.commissionPct,
        commissionBase: c.commissionBase,
        fixedFeeFils: c.fixedFeeFils,
        paymentFeePct: c.paymentFeePct,
      },
    });
    channels.push({ ...c, id: ch.id });
  }

  // Dishes, menu items and channel prices
  const menu: { id: string; name: string; prices: Map<string, number> }[] = [];
  for (const [name, category, packagingCostFils, dineInPrice, lines] of DISHES) {
    const r = await prisma.recipe.create({ data: { outletId, name, category } });
    recipeIds.set(name, r.id);
    await prisma.recipeLine.createMany({
      data: lineData(lines).map((l) => ({ ...l, recipeId: r.id })),
    });
    const mi = await prisma.menuItem.create({
      data: { outletId, recipeId: r.id, name, packagingCostFils },
    });
    const prices = new Map<string, number>();
    for (const ch of channels) {
      const priceFils =
        ch.uplift === 1 ? dineInPrice : roundUpToHalfDirham(dineInPrice * ch.uplift);
      prices.set(ch.id, priceFils);
      await prisma.channelPrice.create({
        data: { outletId, menuItemId: mi.id, channelId: ch.id, priceFils },
      });
    }
    menu.push({ id: mi.id, name, prices });
  }

  // 60 days of orders. Commission/fees/discounts here simulate what a payout
  // statement would report; they are input data, not app calculations.
  const orders: Prisma.OrderCreateManyInput[] = [];
  const items: Prisma.OrderItemCreateManyInput[] = [];
  for (let d = DAYS; d >= 1; d--) {
    const day = daysAgo(d);
    for (const ch of channels) {
      const count = randInt(ch.perDay[0], ch.perDay[1]);
      for (let n = 0; n < count; n++) {
        const orderId = randomUUID();
        const placedAt = new Date(day);
        placedAt.setUTCHours(randInt(4, 18), randInt(0, 59)); // 08:00–22:59 Dubai
        let grossFils = 0;
        const lineCount = randInt(1, 4);
        for (let k = 0; k < lineCount; k++) {
          const m = pick(menu);
          const qty = rand() < 0.85 ? 1 : 2;
          const unitPriceFils = m.prices.get(ch.id)!;
          grossFils += unitPriceFils * qty;
          items.push({
            id: randomUUID(),
            outletId,
            orderId,
            menuItemId: m.id,
            name: m.name,
            qty,
            unitPriceFils,
          });
        }
        const isDelivery = ch.type !== "DINE_IN";
        const discount = isDelivery && rand() < 0.2 ? Math.round(grossFils * 0.2) : 0;
        const base = ch.commissionBase === "GROSS" ? grossFils : Math.round(grossFils / 1.05);
        const commissionFils = Math.round((base * ch.commissionPct) / 100);
        const feesFils = ch.fixedFeeFils + Math.round((grossFils * ch.paymentFeePct) / 100);
        orders.push({
          id: orderId,
          outletId,
          channelId: ch.id,
          externalId: isDelivery ? `${ch.type.slice(0, 3)}-${orderId.slice(0, 8)}` : null,
          placedAt,
          grossFils,
          commissionFils,
          feesFils,
          restaurantFundedDiscountFils: discount,
          payoutFils: isDelivery ? grossFils - commissionFils - feesFils - discount : null,
        });
      }
    }
  }
  for (let i = 0; i < orders.length; i += 1000)
    await prisma.order.createMany({ data: orders.slice(i, i + 1000) });
  for (let i = 0; i < items.length; i += 2000)
    await prisma.orderItem.createMany({ data: items.slice(i, i + 2000) });

  console.log(
    `Done: ${INGREDIENTS.length} ingredients, ${DISHES.length} dishes + ${SUB_RECIPES.length} sub-recipes, ` +
      `${channels.length} channels, ${orders.length} orders / ${items.length} items over ${DAYS} days.\n` +
      `Sign in as ${DEMO_EMAIL}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
