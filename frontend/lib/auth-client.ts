import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"
import { ac, roles } from "./permission";

export const { signIn, signUp, signOut, useSession, updateUser, changePassword } = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL as string,
   plugins: [
        adminClient({
          ac,
          roles,
        })
    ]
});
