import { getServerClient, hasSupabase } from "@/lib/supabase/client";
import type { Category, MenuItem } from "@/lib/types";
import {
  categories as mockCategories,
  menuItems as mockItems,
} from "@/lib/mock-data";
import type { Database } from "@/lib/supabase/database.types";

type MenuRow = Database["public"]["Tables"]["menu_items"]["Row"];
type CatRow = Database["public"]["Tables"]["categories"]["Row"];

function rowToItem(r: MenuRow): MenuItem {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    nameJa: r.name_ja ?? undefined,
    description: r.description,
    price: Number(r.price),
    image: r.image,
    available: r.available,
    tags: r.tags,
    spicy: r.spicy,
  };
}

function rowToCategory(r: CatRow): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    nameJa: r.name_ja ?? undefined,
    icon: r.icon ?? undefined,
  };
}

export async function listCategories(): Promise<Category[]> {
  if (!hasSupabase) return mockCategories;
  const db = getServerClient();
  if (!db) return mockCategories;
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) {
    console.error("[db.listCategories]", error);
    return mockCategories;
  }
  return data.map(rowToCategory);
}

export async function listMenuItems(opts?: {
  onlyAvailable?: boolean;
}): Promise<MenuItem[]> {
  if (!hasSupabase) {
    return opts?.onlyAvailable
      ? mockItems.filter((i) => i.available)
      : mockItems;
  }
  const db = getServerClient();
  if (!db) return mockItems;
  let q = db.from("menu_items").select("*").order("sort_order", { ascending: true });
  if (opts?.onlyAvailable) q = q.eq("available", true);
  const { data, error } = await q;
  if (error || !data) {
    console.error("[db.listMenuItems]", error);
    return mockItems;
  }
  return data.map(rowToItem);
}

export async function upsertMenuItem(item: MenuItem): Promise<void> {
  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db.from("menu_items").upsert({
    id: item.id,
    category_id: item.categoryId,
    name: item.name,
    name_ja: item.nameJa ?? null,
    description: item.description,
    price: item.price,
    image: item.image,
    available: item.available,
    tags: item.tags ?? [],
    spicy: item.spicy ?? 0,
  });
  if (error) throw error;
}

export async function setMenuItemAvailability(
  id: string,
  available: boolean,
): Promise<void> {
  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db.from("menu_items").update({ available }).eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const db = getServerClient();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}
