"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRequestSupabase } from "@/lib/supabase/auth-server";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  const sb = await getRequestSupabase();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Verify the user has a staff profile — otherwise sign them out.
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Login failed" };
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .maybeSingle();
  if (!profile) {
    await sb.auth.signOut();
    return {
      ok: false,
      error:
        "Account exists but has no staff role. Ask the owner to add a profile row.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function logoutAction() {
  const sb = await getRequestSupabase();
  if (sb) await sb.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/staff/login");
}
