import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { writeDevMagicLink } from "./dev-mailer";

const isProd = process.env.NODE_ENV === "production";
const hasResend = Boolean(process.env.AUTH_RESEND_KEY);

export const authFlags = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  magicLink: hasResend || !isProd,
  devMailer: !hasResend && !isProd,
};

const providers: NextAuthConfig["providers"] = [];

if (authFlags.magicLink) {
  providers.push(
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "MarginChef <login@marginchef.app>",
      ...(authFlags.devMailer && {
        sendVerificationRequest: ({ identifier, url }) => writeDevMagicLink(identifier, url),
      }),
    }),
  );
}
if (authFlags.google) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter is typed against the default `@prisma/client` output; our
  // client is generated to lib/generated/prisma with the same model shapes.
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "database" },
  providers,
  pages: { signIn: "/login", verifyRequest: "/login/check-email", error: "/login" },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
