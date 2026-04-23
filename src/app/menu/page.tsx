import { listCategories, listMenuItems } from "@/lib/db";
import { MenuView } from "./menu-view";

export const revalidate = 60;

export default async function MenuPage() {
  const [categories, items] = await Promise.all([
    listCategories(),
    listMenuItems({ onlyAvailable: false }),
  ]);
  return <MenuView categories={categories} items={items} />;
}
