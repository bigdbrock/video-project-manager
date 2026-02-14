"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/domain";
import { createClient } from "@/lib/supabase/client";
import { isUnread } from "@/lib/messageRead";

const navItems = [
  { href: "/", label: "Overview", roles: ["admin", "qc", "editor"] },
  { href: "/projects", label: "Projects", roles: ["admin", "qc"] },
  { href: "/projects/new", label: "Create Project", roles: ["admin", "qc"] },
  { href: "/messages", label: "Messages", roles: ["admin", "qc", "editor"] },
  { href: "/settings", label: "Settings", roles: ["admin", "qc", "editor"] },
  { href: "/my-queue", label: "My Queue", roles: ["editor"] },
];

type SidebarProps = {
  role?: UserRole | null;
  userName?: string | null;
  currentUserId?: string | null;
};

type SidebarMessageRow = {
  project_id: string | null;
  sender_id: string | null;
  created_at: string;
};

export function Sidebar({ role, userName, currentUserId }: SidebarProps) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const visibleItems = role ? navItems.filter((item) => item.roles.includes(role)) : navItems;
  const matchedItems = visibleItems.filter(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const activeHref =
    matchedItems.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const loadUnreadCount = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("project_messages")
          .select("project_id,sender_id,created_at")
          .order("created_at", { ascending: false })
          .limit(400);

        if (error || !mounted) return;

        const count = ((data ?? []) as SidebarMessageRow[]).filter(
          (message) =>
            message.sender_id !== currentUserId &&
            message.project_id &&
            isUnread(currentUserId, message.project_id, message.created_at)
        ).length;
        setUnreadMessages(count);
      } catch {
        if (mounted) setUnreadMessages(0);
      }
    };

    loadUnreadCount();
    interval = setInterval(loadUnreadCount, 10000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [currentUserId]);

  return (
    <aside className="flex h-full w-64 flex-col gap-8 border-r border-white/60 bg-white/70 px-6 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Dream Home Shots</p>
        <p className="mt-2 text-sm text-ink-500">Video Project Manager</p>
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
              <span className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                {item.href === "/messages" && unreadMessages > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {unreadMessages}
                  </span>
                ) : null}
              </span>
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
