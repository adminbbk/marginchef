import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, authFlags } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signInWithGoogle } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  InvalidEmail: "Enter a valid email address.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
  OAuthAccountNotLinked: "This email already signs in another way. Use the magic link instead.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if ((await auth())?.user) redirect("/app");
  const { error } = await searchParams;
  const message =
    typeof error === "string" ? (ERRORS[error] ?? "Sign-in failed. Try again.") : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to MarginChef</CardTitle>
          <CardDescription>New here? Signing in starts your 14-day free trial.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {message && (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
            >
              {message}
            </p>
          )}
          {authFlags.magicLink && (
            <form action={signInWithEmail} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@restaurant.ae"
                />
              </div>
              <Button type="submit" size="lg">
                Email me a sign-in link
              </Button>
            </form>
          )}
          {authFlags.google && (
            <form action={signInWithGoogle}>
              <Button type="submit" variant="outline" size="lg" className="w-full">
                Continue with Google
              </Button>
            </form>
          )}
          {authFlags.devMailer && (
            <p className="text-muted-foreground text-xs">
              Dev mode: no Resend key, so magic links go to <code>.dev-outbox/</code> and the server
              log.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
