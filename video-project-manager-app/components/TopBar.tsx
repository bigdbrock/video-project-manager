"use client";

import Link from "next/link";
import type { UserRole } from "@/types/domain";
import { SessionStatus } from "@/components/SessionStatus";

type TopBarProps = {
  role?: UserRole | null;
  userName?: string | null;
};

export function TopBar({ role, userName }: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-6 border-b border-white/70 bg-white/60 px-8 py-5">
      <div>
        <h2 className="text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Video Project Manager
        </h2>
        <p className="text-sm text-ink-500">Track work from intake to delivery with focused chat.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-ink-900/10 bg-white/80 px-4 py-2 text-xs text-ink-500 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {userName ? `${userName} · ${role ?? ""}` : "System healthy"}
        </div>
        {role !== "editor" ? (
          <Link
            href="/projects/new"
            className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-ink-700"
          >
            New intake
          </Link>
        ) : null}
        <SessionStatus />
      </div>
    </header>
  );
}
