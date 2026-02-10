import { notFound } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fallback = {
  project: {
    id: "fallback",
    title: "ACME - 12 Oak St - Main Edit",
    status: "EDITING",
    due_at: "2026-02-12",
    assigned_editor_id: "Editor One",
    raw_footage_url: "drive.google.com/acme/12-oak/raw",
    brand_assets_url: "drive.google.com/acme/brand",
    music_assets_url: "drive.google.com/acme/music",
  },
  deliverables: [
    { id: "d1", label: "Main video", specs: "1080p, 30fps" },
    { id: "d2", label: "Vertical cut", specs: "1080x1920" },
    { id: "d3", label: "Social teaser", specs: "15s" },
  ],
  messages: [
    { id: "m1", sender_id: "QC", created_at: "2026-02-10T10:12:00Z", message: "Please prioritize the kitchen walkthrough segment." },
    { id: "m2", sender_id: "Editor", created_at: "2026-02-10T10:25:00Z", message: "Got it. I will update and resubmit by tomorrow." },
    { id: "m3", sender_id: "QC", created_at: "2026-02-10T11:02:00Z", message: "Also tighten the drone opener to 6 seconds." },
  ],
};

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  assigned_editor_id: string | null;
  raw_footage_url: string | null;
  brand_assets_url: string | null;
  music_assets_url: string | null;
  preview_url: string | null;
  final_delivery_url: string | null;
};

type DeliverableRow = {
  id: string;
  label: string;
  specs: string | null;
  completed: boolean;
};

type MessageRow = {
  id: string;
  sender_id: string | null;
  created_at: string;
  message: string;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

async function getProjectData(id: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        "id,title,status,due_at,assigned_editor_id,raw_footage_url,brand_assets_url,music_assets_url,preview_url,final_delivery_url"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!project) {
      return { data: null, error: "not_found" };
    }

    const [{ data: deliverables }, { data: messages }] = await Promise.all([
      supabase
        .from("deliverables")
        .select("id,label,specs,completed")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("project_messages")
        .select("id,sender_id,created_at,message")
        .eq("project_id", id)
        .order("created_at", { ascending: true })
        .limit(50),
    ]);

    return {
      data: {
        project: project as ProjectRow,
        deliverables: (deliverables ?? []) as DeliverableRow[],
        messages: (messages ?? []) as MessageRow[],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const result = await getProjectData(params.id);

  if (result.error === "not_found") {
    notFound();
  }

  const data = result.data ?? fallback;
  const lastMessage = data.messages[data.messages.length - 1];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel rounded-xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Project</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {data.project.title}
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              Due {formatDueDate(data.project.due_at)} · Assigned {data.project.assigned_editor_id ?? "Unassigned"}
            </p>
          </div>
          <StatusPill status={data.project.status} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Links</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li>Raw footage: {data.project.raw_footage_url ?? "Not set"}</li>
              <li>Brand assets: {data.project.brand_assets_url ?? "Not set"}</li>
              <li>Music: {data.project.music_assets_url ?? "Not set"}</li>
              <li>Preview: {data.project.preview_url ?? "Not set"}</li>
              <li>Final: {data.project.final_delivery_url ?? "Not set"}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Deliverables</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              {data.deliverables.length ? (
                data.deliverables.map((item) => (
                  <li key={item.id}>
                    {item.label}
                    {item.specs ? ` (${item.specs})` : ""}
                    {item.completed ? " · Complete" : ""}
                  </li>
                ))
              ) : (
                <li>No deliverables yet.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

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
        {result.error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {result.error}. Showing fallback data.
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-4">
          {data.messages.length ? (
            data.messages.map((message) => (
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
          <textarea
            className="min-h-[90px] rounded-xl border border-ink-900/10 bg-white/80 px-3 py-2 text-sm text-ink-900"
            placeholder="Leave a note for QC or the editor..."
          />
          <button
            type="button"
            className="self-end rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Send message
          </button>
        </div>
      </section>
    </div>
  );
}
