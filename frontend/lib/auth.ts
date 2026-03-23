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

    requireEmailVerification: true,

    async sendVerificationEmail({ user, url }) {
      // Wire to your email provider (Resend, Postmark, etc.)
      // For now, log it — replace with real send in Phase 5
      console.log(`[auth] verification email → ${user.email}: ${url}`);
      // await sendEmail({ to: user.email, subject: "Verify your email", url });
    },

    async sendResetPassword({ user, url }) {
      console.log(`[auth] reset password → ${user.email}: ${url}`);
      // await sendEmail({ to: user.email, subject: "Reset your password", url });
    },
  },


  // social authentication providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
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
});
