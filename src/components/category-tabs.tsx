"use client";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 w-max pb-2">
        <TabButton active={active === null} onClick={() => onChange(null)} label="All" icon="✨" />
        {categories.map((c) => (
          <TabButton
            key={c.id}
            active={active === c.id}
            onClick={() => onChange(c.id)}
            label={c.name}
            icon={c.icon}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm border transition-colors",
        active
          ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-gold)]/40",
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
