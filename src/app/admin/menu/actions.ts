"use server";

import { revalidatePath } from "next/cache";
import {
  deleteMenuItem,
  setMenuItemAvailability,
  upsertMenuItem,
} from "@/lib/db/menu";
import { authorizeAction } from "@/lib/auth";
import type { MenuItem } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveItemAction(item: MenuItem): Promise<ActionResult> {
  const auth = await authorizeAction(["admin"]);
  if (!auth.ok) return auth;
  try {
    const clean: MenuItem = {
      ...item,
      id: item.id.startsWith("new-")
        ? `m${Date.now().toString(36)}`
        : item.id,
      name: item.name.trim(),
      description: item.description.trim(),
      price: Number(item.price) || 0,
      image: item.image.trim(),
      tags: item.tags ?? [],
      spicy: item.spicy ?? 0,
    };
    if (!clean.name) return { ok: false, error: "Name is required" };
    if (!clean.categoryId) return { ok: false, error: "Category is required" };
    await upsertMenuItem(clean);
    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function toggleAvailabilityAction(
  id: string,
  available: boolean,
): Promise<ActionResult> {
  const auth = await authorizeAction(["admin"]);
  if (!auth.ok) return auth;
  try {
    await setMenuItemAvailability(id, available);
    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const auth = await authorizeAction(["admin"]);
  if (!auth.ok) return auth;
  try {
    await deleteMenuItem(id);
    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

function msg(e: unknown) {
  if (e instanceof Error) return e.message;
  return "Unknown error";
}
