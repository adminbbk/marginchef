import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-3 px-4 py-12">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-muted-foreground">
        We sent you a sign-in link. It works once and expires in 24 hours.
      </p>
      <Link href="/login" className="text-sm underline underline-offset-4">
        Use a different email
      </Link>
    </main>
  );
}
