import Link from "next/link";
import { requireRoleOrRedirect } from "@/lib/auth";
import { logoutAction } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function StaffHubPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireRoleOrRedirect(["admin", "chef"]);
  const { denied } = await searchParams;

  const isAdmin = user.role === "admin";

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
              Cocotei — Internal
            </div>
            <h1 className="font-display mt-1 text-3xl font-semibold">Staff</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Signed in as{" "}
              <span className="text-white font-medium">
                {user.displayName ?? user.email}
              </span>{" "}
              <span className="ml-1 inline-block rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {user.role}
              </span>
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)]"
            >
              Sign out
            </button>
          </form>
        </div>

        {denied === "1" && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            That section is restricted to admins.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <ShortcutCard
            href="/kitchen"
            title="Kitchen Display"
            desc="Live order queue — chef view"
            icon="👨‍🍳"
          />
          {isAdmin && (
            <ShortcutCard
              href="/admin"
              title="Admin Console"
              desc="Menu, orders, analytics"
              icon="⚙️"
            />
          )}
        </div>

        {isAdmin && (
          <div className="mt-10">
            <div className="text-xs uppercase tracking-[0.25em] text-[var(--color-muted)] mb-3">
              Customer flow — simulate QR scan
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[3, 7, 11].map((t) => (
                <Link
                  key={t}
                  href={`/t/demo-${t}`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 text-center text-sm hover:border-[var(--color-gold)]/40"
                >
                  Table {t}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ShortcutCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-gold)]/40"
    >
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-[var(--color-muted)]">{desc}</div>
      </div>
      <div className="text-[var(--color-muted)]">→</div>
    </Link>
  );
}
