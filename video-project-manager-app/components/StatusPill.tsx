import type { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  NEW: "bg-sand-100 text-ink-700",
  ASSIGNED: "bg-emerald-100 text-emerald-700",
  EDITING: "bg-amber-100 text-amber-700",
  QC: "bg-sky-100 text-sky-700",
  REVISION_REQUESTED: "bg-rose-100 text-rose-700",
  READY: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-zinc-100 text-zinc-600",
  ON_HOLD: "bg-orange-100 text-orange-700",
};

export function StatusPill({ status }: { status: ReactNode }) {
  const label = String(status);
  const classes = statusStyles[label] ?? "bg-sand-100 text-ink-700";
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${classes}`}>
      {label}
    </span>
  );
}
