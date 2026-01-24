import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession, updateUser } = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL as string,
});
