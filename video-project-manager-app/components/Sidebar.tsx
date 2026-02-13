"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/domain";

const navItems = [
  { href: "/", label: "Overview", roles: ["admin", "qc", "editor"] },
  { href: "/projects", label: "Projects", roles: ["admin", "qc"] },
  { href: "/projects/new", label: "Create Project", roles: ["admin", "qc"] },
  { href: "/my-queue", label: "My Queue", roles: ["editor"] },
];

type SidebarProps = {
  role?: UserRole | null;
  userName?: string | null;
};

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = role ? navItems.filter((item) => item.roles.includes(role)) : navItems;
  const matchedItems = visibleItems.filter(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const activeHref =
    matchedItems.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  return (
    <aside className="flex h-full w-64 flex-col gap-8 border-r border-white/60 bg-white/70 px-6 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Dream Home Shots</p>
        <h1 className="mt-3 font-semibold text-2xl text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Video Ops
        </h1>
        <p className="mt-2 text-sm text-ink-500">Production control center</p>
        <div className="mt-4 rounded-xl border border-ink-900/10 bg-white/80 px-3 py-2 text-xs text-ink-500">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-300">Signed in</p>
          <p className="mt-1 text-sm text-ink-900">{userName ?? "Team member"}</p>
          <p className="mt-1 text-[11px] text-ink-500">{role ?? "Role pending"}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {visibleItems.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                active
                  ? "bg-ink-900 text-white shadow-card"
                  : "text-ink-500 hover:bg-white hover:text-ink-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-ink-900/10 bg-sand-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">Focus</p>
        <p className="mt-2 text-sm text-ink-700">Keep every deliverable, link, and note in one place.</p>
      </div>
    </aside>
  );
}
