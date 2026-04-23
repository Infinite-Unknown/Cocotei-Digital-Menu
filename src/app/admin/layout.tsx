import Link from "next/link";
import type { ReactNode } from "react";
import { requireRoleOrRedirect } from "@/lib/auth";
import { logoutAction } from "@/app/staff/login/actions";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/menu", label: "Menu", icon: "🍱" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRoleOrRedirect(["admin"]);
  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <Link href="/staff" className="p-4 border-b border-[var(--color-border)]">
          <div className="font-display text-lg font-semibold">Cocotei</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
            Admin Console
          </div>
        </Link>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--color-border)] text-xs">
          <div className="text-[var(--color-muted)] mb-1">Signed in as</div>
          <div className="text-white">{user.displayName ?? user.email}</div>
          <div className="mt-0.5 inline-block rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            {user.role}
          </div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
