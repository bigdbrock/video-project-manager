"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  sender_id: string | null;
  created_at: string;
  message: string;
};

type ChatPanelProps = {
  projectId: string;
  initialMessages: ChatMessage[];
  onSend: (formData: FormData) => Promise<void>;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ProjectChatPanel({ projectId, initialMessages, onSend }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    try {
      const supabase = createClient();

      const fetchMessages = async () => {
        const { data, error: fetchError } = await supabase
          .from("project_messages")
          .select("id,sender_id,created_at,message")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setMessages((data ?? []) as ChatMessage[]);
        setError(null);
      };

      fetchMessages();
      interval = setInterval(fetchMessages, 8000);
    } catch (err) {
      setError("Supabase not configured");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [projectId]);

  const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);

  return (
    <section className="glass-panel rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Project chat</p>
          <h3 className="mt-2 text-lg font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            In-context updates
          </h3>
        </div>
        <span className="text-xs text-ink-300">
          {lastMessage ? `Last update ${formatTime(lastMessage.created_at)}` : "No messages yet"}
        </span>
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
                <span>{message.sender_id ?? "Unknown"}</span>
                <span>{formatTime(message.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">{message.message}</p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4 text-sm text-ink-500">
            No messages yet.
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <form action={onSend} className="flex flex-col gap-3">
          <textarea
            name="message"
            required
            className="min-h-[90px] rounded-xl border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
            placeholder="Leave a note for QC or the editor..."
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
