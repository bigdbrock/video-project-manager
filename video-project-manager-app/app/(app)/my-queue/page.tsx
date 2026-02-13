import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fallbackQueue = [
  { id: "1", title: "Acme - 12 Oak St", status: "EDITING", due: "Feb 12", priority: "Normal" },
  { id: "2", title: "Bluebird - 55 Ridge Ln", status: "REVISION_REQUESTED", due: "Feb 11", priority: "Rush" },
  { id: "3", title: "Canyon - 18 Desert Way", status: "EDITING", due: "Feb 17", priority: "Normal" },
];

type QueueRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string | null;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function getQueue() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Missing session" };
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id,title,status,due_at,priority")
      .eq("assigned_editor_id", user.id)
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as QueueRow[], error: null };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

export default async function MyQueuePage() {
  const result = await getQueue();
  const queue = result.data ?? fallbackQueue;

  async function updateQueueItem(formData: FormData) {
    "use server";

    const projectId = String(formData.get("project_id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const previewUrl = String(formData.get("preview_url") || "").trim();

    if (!projectId) return;

    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: current } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .maybeSingle();

      const update: Record<string, string | null> = {
        preview_url: previewUrl || null,
      };
      if (status) {
        update.status = status;
      }

      await supabase.from("projects").update(update).eq("id", projectId);

      if (status && status !== current?.status) {
        await supabase.from("activity_log").insert({
          project_id: projectId,
          actor_id: user.id,
          action: status === "QC" ? "EDITOR_SUBMITTED_QC" : "EDITOR_STATUS_UPDATED",
          meta: { status },
        });
      }
    } catch (error) {
      return;
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Editor view</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          My Queue
        </h2>
        <p className="mt-2 text-sm text-ink-500">Prioritize tasks by due date and revision urgency.</p>
        {result.error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {result.error}. Showing fallback data.
          </div>
        ) : null}
      </header>
      <div className="glass-panel rounded-xl p-6 shadow-card">
        <div className="grid gap-4">
          {queue.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-ink-900/10 bg-white/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link className="text-sm font-semibold text-ink-900" href={`/projects/${item.id}`}>{item.title}</Link>
                  <p className="text-xs text-ink-500">
                    Due {"due" in item ? item.due : formatDueDate(item.due_at)} · Priority {item.priority ?? "Normal"}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
              <form action={updateQueueItem} className="grid gap-3 text-xs text-ink-500 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="project_id" value={item.id} />
                <label className="flex flex-col gap-2">
                  Status
                  <select name="status" defaultValue={item.status} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900">
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="EDITING">EDITING</option>
                    <option value="QC">QC</option>
                    <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  Preview link
                  <input
                    name="preview_url"
                    className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
                    placeholder="https://frame.io/..."
                  />
                </label>
                <button type="submit" className="h-9 rounded-full bg-ink-900 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                  Update
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

