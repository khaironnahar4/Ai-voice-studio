import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session, User } from "./auth";

// Use in Server Components and Route Handlers
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({
    headers: await headers(),
  });
}

// Use when the page must be authenticated — redirects if not
export async function requireSession(): Promise<{
  session: Session;
  user: User;
}> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return { session, user: session.user };
}

// Use in admin routes
export async function requireAdmin(): Promise<{
  session: Session;
  user: User;
}> {
  const { session, user } = await requireSession();
  if (user.role !== "admin") redirect("/");
  return { session, user };
}