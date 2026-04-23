import { listCategories, listMenuItems, hasSupabase } from "@/lib/db";
import { AdminMenuView } from "./admin-menu-view";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [categories, items] = await Promise.all([
    listCategories(),
    listMenuItems(),
  ]);
  return (
    <AdminMenuView
      categories={categories}
      items={items}
      supabaseConnected={hasSupabase}
    />
  );
}
