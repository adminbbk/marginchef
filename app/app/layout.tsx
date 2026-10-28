import { getTenant } from "@/lib/tenant/context";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { outlet, user } = await getTenant();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">MarginChef</p>
            <p className="truncate font-medium" data-testid="outlet-name">
              {outlet.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden text-sm sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
