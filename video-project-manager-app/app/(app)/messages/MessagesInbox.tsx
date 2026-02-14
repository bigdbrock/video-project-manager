"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isUnread } from "@/lib/messageRead";

type InboxMessageRow = {
  id: string;
  project_id: string;
  sender_id: string | null;
  created_at: string;
  message: string;
  project: { id: string; title: string } | null;
  sender: { full_name: string | null } | null;
};

type ProjectPreview = {
  projectId: string;
  projectTitle: string;
  latestMessage: string;
  latestAt: string;
  unreadCount: number;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function MessagesInbox({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<InboxMessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error: loadError } = await supabase
          .from("project_messages")
          .select("id,project_id,sender_id,created_at,message,project:projects(id,title),sender:profiles(full_name)")
          .order("created_at", { ascending: false })
          .limit(500);

        if (!mounted) return;

        if (loadError) {
          setError(loadError.message);
          return;
        }

        setRows((data ?? []) as InboxMessageRow[]);
        setError(null);
      } catch {
        if (mounted) {
          setRows([]);
          setError("Supabase not configured");
        }
      }
    };

    load();
    interval = setInterval(load, 10000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const previews = useMemo(() => {
    const byProject = new Map<string, ProjectPreview>();

    for (const row of rows) {
      if (!row.project_id || !row.project) continue;
      const existing = byProject.get(row.project_id);
      const unread = row.sender_id !== currentUserId && isUnread(currentUserId, row.project_id, row.created_at);

      if (!existing) {
        byProject.set(row.project_id, {
          projectId: row.project_id,
          projectTitle: row.project.title,
          latestMessage: row.message,
          latestAt: row.created_at,
          unreadCount: unread ? 1 : 0,
        });
        continue;
      }

      if (unread) {
        existing.unreadCount += 1;
      }
    }

    return Array.from(byProject.values())
      .filter((item) => item.unreadCount > 0)
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  }, [rows, currentUserId]);

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">{error}</div>
      ) : null}

      {previews.length === 0 ? (
        <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4 text-sm text-ink-500">
          No unread messages right now.
        </div>
      ) : (
        previews.map((item) => (
          <Link
            key={item.projectId}
            href={`/projects/${item.projectId}`}
            className="rounded-xl border border-ink-900/10 bg-white/70 p-4 transition hover:border-ink-900/20"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink-900">{item.projectTitle}</p>
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {item.unreadCount}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-ink-700">{item.latestMessage}</p>
            <p className="mt-2 text-xs text-ink-400">{formatTime(item.latestAt)}</p>
          </Link>
        ))
      )}
    </div>
  );
}
