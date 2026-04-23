/**
 * Usage:  npm run seed
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Idempotent: uses upsert, safe to re-run.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { categories, menuItems } from "../src/lib/mock-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "\nMissing env vars. Add to .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=<service role key>\n",
  );
  process.exit(1);
}

const db = createClient<Database>(url, key, {
  auth: { persistSession: false },
});

async function main() {
  console.log("▶ Seeding categories…");
  const catRows = categories.map((c, idx) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    name_ja: c.nameJa ?? null,
    icon: c.icon ?? null,
    sort_order: idx,
  }));
  const catRes = await db.from("categories").upsert(catRows);
  if (catRes.error) {
    console.error("✖ categories failed:", catRes.error.message);
    process.exit(1);
  }
  console.log(`  ✓ ${catRows.length} categories`);

  console.log("▶ Seeding menu items…");
  const itemRows = menuItems.map((m, idx) => ({
    id: m.id,
    category_id: m.categoryId,
    name: m.name,
    name_ja: m.nameJa ?? null,
    description: m.description,
    price: m.price,
    image: m.image,
    available: m.available,
    tags: m.tags ?? [],
    spicy: m.spicy ?? 0,
    sort_order: idx,
  }));
  const itemRes = await db.from("menu_items").upsert(itemRows);
  if (itemRes.error) {
    console.error("✖ menu_items failed:", itemRes.error.message);
    process.exit(1);
  }
  console.log(`  ✓ ${itemRows.length} menu items`);

  console.log("\n✓ Seed complete — menu is live on Supabase.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
