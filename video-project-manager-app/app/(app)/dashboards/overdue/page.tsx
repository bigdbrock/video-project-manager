import { createServerSupabaseClient } from "@/lib/supabase/server";

const fallbackOverdue = [
  { id: "1", title: "Bluebird - 55 Ridge Ln", due: "Feb 11", owner: "Editor One" },
  { id: "2", title: "Canyon - 66 Mesa Dr", due: "Feb 11", owner: "Editor One" },
];

type OverdueRow = {
  id: string;
  title: string;
  due_at: string | null;
  assigned_editor_id: string | null;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function getOverdue() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id,title,due_at,assigned_editor_id,status")
      .not("status", "in", "(DELIVERED,ARCHIVED)")
      .not("due_at", "is", null)
      .lt("due_at", new Date().toISOString())
      .order("due_at", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as OverdueRow[], error: null };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

export default async function OverdueDashboard() {
  const result = await getOverdue();
  const overdue = result.data ?? fallbackOverdue;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Dashboards</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Overdue Projects
        </h2>
        <p className="mt-2 text-sm text-ink-500">Projects past due and not delivered.</p>
        {result.error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {result.error}. Showing fallback data.
          </div>
        ) : null}
      </header>
      <div className="glass-panel rounded-xl p-6 shadow-card">
        <div className="grid gap-4">
          {overdue.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="text-xs text-ink-500">
                  Owner {"owner" in item ? item.owner : item.assigned_editor_id ?? "Unassigned"}
                </p>
              </div>
              <div className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                Due {"due" in item ? item.due : formatDueDate(item.due_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
