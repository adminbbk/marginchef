"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

const emailSchema = z.email().max(254);

export async function signInWithEmail(formData: FormData) {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) redirect("/login?error=InvalidEmail");
  await signIn("resend", { email: parsed.data, redirectTo: "/app" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/app" });
}
