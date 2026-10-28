import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Profit dashboard" };

// Phase 0: proves the tenant-scoped data path end to end. The real
// dashboard (headline cards, dish × channel table, flags) is phase 3.
export default async function DashboardPage() {
  const { db } = await getTenant();
  const [menuItems, orders] = await Promise.all([db.menuItem.count(), db.order.count()]);
  const isEmpty = menuItems === 0 && orders === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Profit dashboard</h1>
      {isEmpty ? (
        <Card data-testid="empty-dashboard">
          <CardHeader>
            <CardTitle>No data yet</CardTitle>
            <CardDescription>
              Add your menu, recipes and sales channels to see the profit of every dish on every
              channel. The setup wizard is coming soon.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Menu items</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{menuItems}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Orders recorded</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{orders}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
