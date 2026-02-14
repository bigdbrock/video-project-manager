"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isUnread, setLastSeenAt as persistLastSeenAt } from "@/lib/messageRead";

export type ChatMessage = {
  id: string;
  sender_id: string | null;
  sender_name?: string | null;
  created_at: string;
  message: string;
};

type MessageQueryRow = {
  id: string;
  sender_id: string | null;
  created_at: string;
  message: string;
  sender: { full_name: string | null } | null;
};

type ChatPanelProps = {
  projectId: string;
  initialMessages: ChatMessage[];
  onSend: (formData: FormData) => Promise<void>;
  currentUserId?: string | null;
};

const knownMentions = new Set(["@qc", "@editor", "@admin", "@you"]);

function renderMessageWithMentions(message: string) {
  const parts = message.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, index) => {
    if (knownMentions.has(part.toLowerCase())) {
      return (
        <span key={`${part}-${index}`} className="rounded bg-ember-500/15 px-1 py-0.5 font-semibold text-ember-600">
          {part}
        </span>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ProjectChatPanel({ projectId, initialMessages, onSend, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const supabase = createClient();

    const fetchMessages = async () => {
      const { data, error: fetchError } = await supabase
        .from("project_messages")
        .select("id,sender_id,created_at,message,sender:profiles(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const normalized = (data ?? []).map((item) => {
        const row = item as MessageQueryRow;
        return {
          id: row.id,
          sender_id: row.sender_id,
          sender_name: row.sender?.full_name ?? null,
          created_at: row.created_at,
          message: row.message,
        };
      });
      setMessages(normalized);
      setError(null);
    };

    fetchMessages();
    interval = setInterval(fetchMessages, 8000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [projectId]);

  const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);
  const unreadCount = currentUserId
    ? messages.filter((message) => message.sender_id !== currentUserId && isUnread(currentUserId, projectId, message.created_at)).length
    : 0;

  const handleJumpToLatest = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (currentUserId && lastMessage) {
      persistLastSeenAt(currentUserId, projectId, lastMessage.created_at);
      setMessages((current) => current.slice());
    }
  };

  const handleMarkRead = () => {
    if (currentUserId && lastMessage) {
      persistLastSeenAt(currentUserId, projectId, lastMessage.created_at);
      setMessages((current) => current.slice());
    }
  };

  return (
    <section className="glass-panel rounded-xl p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Project chat</p>
          <h3 className="mt-2 text-lg font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            In-context updates
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleJumpToLatest}
              className="rounded-full border border-ink-900/10 bg-white/80 px-3 py-1 text-xs text-ink-700"
            >
              Jump to latest ({unreadCount})
            </button>
          ) : null}
          {lastMessage ? (
            <button
              type="button"
              onClick={handleMarkRead}
              className="text-xs text-ink-300 transition hover:text-ink-700"
            >
              Mark read
            </button>
          ) : null}
          <span className="text-xs text-ink-300">
            {lastMessage ? `Last update ${formatTime(lastMessage.created_at)}` : "No messages yet"}
          </span>
        </div>
      </div>
      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          {error}. Showing latest available data.
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-4">
        {messages.length ? (
          messages.map((message) => (
            <div key={message.id} className="rounded-xl border border-ink-900/10 bg-white/70 p-4">
              <div className="flex items-center justify-between text-xs text-ink-300">
                <span>
                  {currentUserId && message.sender_id === currentUserId
                    ? "You"
                    : message.sender_name ?? message.sender_id ?? "Unknown"}
                </span>
                <span>{formatTime(message.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-700">
                {renderMessageWithMentions(message.message)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4 text-sm text-ink-500">
            No messages yet.
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <form action={onSend} className="flex flex-col gap-3">
          <textarea
            name="message"
            required
            className="min-h-[90px] rounded-xl border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
            placeholder="Leave a note for QC or the editor... Use @qc or @editor to mention."
          />
          <button
            type="submit"
            className="self-end rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Send message
          </button>
        </form>
      </div>
    </section>
  );
}
