import { listOrders } from "@/lib/db/orders";
import { hasSupabase } from "@/lib/db";
import { requireRoleOrRedirect } from "@/lib/auth";
import { KitchenBoard } from "./kitchen-board";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const user = await requireRoleOrRedirect(["admin", "chef"]);
  const orders = await listOrders({
    statuses: ["confirmed", "preparing", "ready", "served"],
    limit: 100,
  });
  return (
    <KitchenBoard
      initial={orders}
      supabaseConnected={hasSupabase}
      user={{ displayName: user.displayName, email: user.email, role: user.role }}
    />
  );
}
