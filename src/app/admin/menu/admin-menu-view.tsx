"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import type { Category, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, cn } from "@/lib/utils";
import {
  deleteItemAction,
  saveItemAction,
  toggleAvailabilityAction,
} from "./actions";

type Patch =
  | { kind: "upsert"; item: MenuItem }
  | { kind: "delete"; id: string }
  | { kind: "toggle"; id: string; available: boolean };

function applyPatch(items: MenuItem[], p: Patch): MenuItem[] {
  switch (p.kind) {
    case "upsert": {
      const exists = items.some((i) => i.id === p.item.id);
      return exists
        ? items.map((i) => (i.id === p.item.id ? p.item : i))
        : [...items, p.item];
    }
    case "delete":
      return items.filter((i) => i.id !== p.id);
    case "toggle":
      return items.map((i) =>
        i.id === p.id ? { ...i, available: p.available } : i,
      );
  }
}

export function AdminMenuView({
  categories,
  items,
  supabaseConnected,
}: {
  categories: Category[];
  items: MenuItem[];
  supabaseConnected: boolean;
}) {
  const [optimisticItems, mutate] = useOptimistic(items, applyPatch);
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimisticItems.filter((i) => {
      if (filter && i.categoryId !== filter) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.nameJa?.includes(query);
    });
  }, [optimisticItems, filter, query]);

  function notify(err?: string) {
    if (err) {
      setBanner(err);
      setTimeout(() => setBanner(null), 4000);
    }
  }

  function toggle(id: string, available: boolean) {
    startTransition(async () => {
      mutate({ kind: "toggle", id, available });
      const res = await toggleAvailabilityAction(id, available);
      if (!res.ok) notify(res.error);
    });
  }

  function save(draft: MenuItem) {
    startTransition(async () => {
      mutate({ kind: "upsert", item: draft });
      setEditing(null);
      const res = await saveItemAction(draft);
      if (!res.ok) notify(res.error);
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this item from the menu?")) return;
    startTransition(async () => {
      mutate({ kind: "delete", id });
      const res = await deleteItemAction(id);
      if (!res.ok) notify(res.error);
    });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Menu management</h1>
            {supabaseConnected ? (
              <Badge tone="green">● Supabase</Badge>
            ) : (
              <Badge tone="yellow">● Mock data</Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {optimisticItems.length} items ·{" "}
            {optimisticItems.filter((i) => !i.available).length} sold out
          </p>
        </div>
        <Button
          onClick={() =>
            setEditing({
              id: `new-${Date.now()}`,
              categoryId: categories[0]?.id ?? "",
              name: "",
              description: "",
              price: 0,
              image: "",
              available: true,
            })
          }
          disabled={!supabaseConnected}
          title={!supabaseConnected ? "Connect Supabase to enable writes" : ""}
        >
          + New item
        </Button>
      </div>

      {!supabaseConnected && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          <strong>Read-only mode.</strong> Menu is served from mock data. Set{" "}
          <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-xs">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          in <code>.env.local</code>, then run{" "}
          <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-xs">
            npm run seed
          </code>
          .
        </div>
      )}

      {banner && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {banner}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm outline-none focus:border-[var(--color-gold)]/60"
        />
        <select
          value={filter ?? ""}
          onChange={(e) => setFilter(e.target.value || null)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface-2)]">
            <tr>
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => {
              const cat = categories.find((c) => c.id === i.categoryId);
              return (
                <tr
                  key={i.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/30"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {i.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={i.image}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">
                          {i.name || <i>Untitled</i>}
                        </div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {i.nameJa}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-muted)]">
                    {cat?.name}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-gold)]">
                    {formatPrice(i.price)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggle(i.id, !i.available)}
                      disabled={!supabaseConnected}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
                        i.available ? "bg-green-600" : "bg-[var(--color-surface-2)]",
                        !supabaseConnected && "opacity-40 cursor-not-allowed",
                      )}
                      aria-label="Toggle availability"
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 rounded-full bg-white transition-transform mt-0.5",
                          i.available ? "translate-x-5" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(i)}
                        disabled={!supabaseConnected}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => remove(i.id)}
                        disabled={!supabaseConnected}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="p-10 text-center text-[var(--color-muted)]">
            No items match.
          </div>
        )}
      </div>

      {editing && (
        <ItemEditor
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ItemEditor({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem;
  categories: Category[];
  onClose: () => void;
  onSave: (m: MenuItem) => void;
}) {
  const [draft, setDraft] = useState(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold mb-4">
          {item.id.startsWith("new-") ? "Add item" : "Edit item"}
        </h2>
        <div className="space-y-3">
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="input-base"
            />
          </Field>
          <Field label="Japanese name">
            <input
              value={draft.nameJa ?? ""}
              onChange={(e) => setDraft({ ...draft, nameJa: e.target.value })}
              className="input-base"
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="input-base"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={draft.categoryId}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                className="input-base"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (RM)">
              <input
                type="number"
                step="0.5"
                value={draft.price}
                onChange={(e) =>
                  setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })
                }
                className="input-base"
              />
            </Field>
          </div>
          <Field label="Image URL">
            <input
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="https://…"
              className="input-base"
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </div>
      </div>
      <style>{`.input-base{background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none;width:100%;color:inherit;}.input-base:focus{border-color:var(--color-gold);}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
