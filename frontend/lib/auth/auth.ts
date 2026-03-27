import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { admin } from "better-auth/plugins";
import { ac, roles } from "./permission";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  advanced: {
    database: {
      generateId: "uuid",
    },
  },

  
  // authenticaiton with email and password
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        return bcrypt.hash(password, 10);
      },
      verify: async ({ password, hash }) => {
        return bcrypt.compare(password, hash);
      },
    },

    requireEmailVerification: false, // Set to true in production for security

    // async sendVerificationEmail({ user, url }) {
    //   // Wire to your email provider (Resend, Postmark, etc.)
    //   // For now, log it — replace with real send in Phase 5
    //   console.log(`[auth] verification email → ${user.email}: ${url}`);
    //   // await sendEmail({ to: user.email, subject: "Verify your email", url });
    // },

    // async sendResetPassword({ user, url }) {
    //   console.log(`[auth] reset password → ${user.email}: ${url}`);
    //   // await sendEmail({ to: user.email, subject: "Reset your password", url });
    // },
  },


  // social authentication providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  // ── Session Config ────────────────────────────────────────────
  session: {
    // Rolling session — extends on each request
    // strategy: "jwt",
    expiresIn: 60 * 60 * 24 * 7,        // 7 days active lifetime
    updateAge: 60 * 60 * 24,             // refresh token if >1 day old
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                    // 5-min client cache to reduce DB reads
    },
  },

  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "user",
      adminRoles: ["admin", "owner"],
      impersonationSessionDuration: 60 * 60 * 24, // 1 day in seconds
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────
  callbacks: {
    // Fires after any sign-in (password or OAuth)
    async session({ session, user }) {
      // Attach role to session so middleware can read it without a DB hit
      session.user.role = user.role ?? null;
      session.user.banned = user.banned ?? false;
      return session;
    },

    // Block banned users at the auth layer — never reaches your app
    async signIn({ user }) {
      if (user.banned) {
        const expires = user.banExpires;
        const isPermanent = !expires || new Date(expires) > new Date();
        if (isPermanent) {
          throw new Error("Your account has been suspended.");
        }
      }
      return true;
    },
  },

});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
