import "server-only";
import { redirect } from "next/navigation";
import { getRequestSupabase } from "@/lib/supabase/auth-server";

export type Role = "admin" | "chef";

export type SessionUser = {
  id: string;
  email: string | null;
  role: Role;
  displayName: string | null;
};

export type AuthError =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | { kind: "no_profile" }
  | { kind: "forbidden" };

/**
 * Returns the current authenticated user with their profile role, or null if
 * not signed in / not a staff member. Doesn't throw or redirect.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const sb = await getRequestSupabase();
  if (!sb) return null;
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes.user) return null;

  const { data: profile, error } = await sb
    .from("profiles")
    .select("role, display_name")
    .eq("user_id", userRes.user.id)
    .maybeSingle();

  if (error || !profile) return null;

  return {
    id: userRes.user.id,
    email: userRes.user.email ?? null,
    role: profile.role,
    displayName: profile.display_name,
  };
}

/**
 * Server-component guard: redirects to /staff/login if not signed in,
 * or denies if user's role isn't allowed.
 */
export async function requireRoleOrRedirect(
  allowed: Role[],
  redirectTo = "/staff/login",
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  if (!allowed.includes(user.role)) redirect("/staff?denied=1");
  return user;
}

/**
 * Server-action guard: returns a result object — caller surfaces the error.
 */
export async function authorizeAction(
  allowed: Role[],
): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!allowed.includes(user.role))
    return { ok: false, error: `Requires role: ${allowed.join(" or ")}` };
  return { ok: true, user };
}
