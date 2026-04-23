import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "default" | "accent" | "gold" | "green" | "yellow" | "red" | "blue";

const tones: Record<Tone, string> = {
  default: "bg-[var(--color-surface-2)] text-[var(--color-foreground)]",
  accent: "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30",
  gold: "bg-[var(--color-gold)]/15 text-[var(--color-gold)] border border-[var(--color-gold)]/30",
  green: "bg-green-500/15 text-green-400 border border-green-500/30",
  yellow: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  red: "bg-red-500/15 text-red-400 border border-red-500/30",
  blue: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
