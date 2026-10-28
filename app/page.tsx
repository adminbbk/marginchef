import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Placeholder. The real landing page and profit-check calculator are phase 4.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-muted-foreground text-sm font-medium">MarginChef</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Which dishes make money on which channel?
      </h1>
      <p className="text-muted-foreground">
        True profit for every dish on dine-in, Talabat, Deliveroo, Careem, Keeta and Noon, after
        commission, packaging and 5% VAT.
      </p>
      <div>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Sign in or start free trial
        </Link>
      </div>
    </main>
  );
}
