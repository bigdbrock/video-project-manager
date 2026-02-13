import { SectionCard } from "@/components/SectionCard";
import { StatusPill } from "@/components/StatusPill";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const highlights = [
  { label: "Active projects", value: "26", trend: "+3 this week" },
  { label: "Revisions open", value: "7", trend: "2 urgent" },
  { label: "Editors online", value: "5", trend: "2 in QC" },
];

const focusList = [
  { title: "Canyon - 66 Mesa Dr", status: "QC", detail: "Awaiting approval" },
  { title: "Bluebird - 55 Ridge Ln", status: "REVISION_REQUESTED", detail: "Color pass" },
  { title: "Acme - 12 Oak St", status: "EDITING", detail: "Preview due tomorrow" },
];

type OverviewProjectRow = {
  id: string;
  title: string;
  due_at: string | null;
  status: string;
  revision_count: number;
  needs_info: boolean;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function getOverviewMetrics() {
  try {
    const supabase = await createServerSupabaseClient();
    let { data, error } = await supabase
      .from("projects")
      .select("id,title,due_at,status,revision_count,needs_info");

    if (error?.message.includes("column projects.needs_info does not exist")) {
      const fallback = await supabase
        .from("projects")
        .select("id,title,due_at,status,revision_count");
      data = (fallback.data ?? []).map((row) => ({ ...row, needs_info: false }));
      error = fallback.error;
    }

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as OverviewProjectRow[];
    const overdueProjects = rows
      .filter(
        (project) =>
          !project.needs_info &&
          project.due_at &&
          !["DELIVERED", "ARCHIVED"].includes(project.status) &&
          new Date(project.due_at).getTime() < Date.now()
      )
      .sort((a, b) => {
        const left = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
        const right = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
        return left - right;
      });

    const avgRevisions =
      rows.length > 0
        ? rows.reduce((sum, project) => sum + (project.revision_count ?? 0), 0) / rows.length
        : null;

    return { data: { overdueProjects, avgRevisions }, error: null };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

export default async function OverviewPage() {
  const result = await getOverviewMetrics();
  const metrics = result.data ?? { overdueProjects: [] as OverviewProjectRow[], avgRevisions: null as number | null };

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.label} className="glass-panel rounded-xl p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-300">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {item.value}
            </p>
            <p className="mt-2 text-sm text-ink-500">{item.trend}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Today's focus">
          <div className="mt-4 flex flex-col gap-4">
            {focusList.map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-xl border border-ink-900/5 bg-white/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="text-xs text-ink-500">{item.detail}</p>
                </div>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="SLA temperature">
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl bg-ink-900 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Overdue risk</p>
              <p className="mt-3 text-2xl font-semibold">{metrics.overdueProjects.length} projects</p>
              <p className="mt-2 text-xs text-white/70">
                {metrics.overdueProjects.length ? "Escalate to QC today" : "No overdue projects right now"}
              </p>
            </div>
            <div className="rounded-xl border border-ink-900/10 bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Avg revisions per project</p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">
                {metrics.avgRevisions === null ? "N/A" : metrics.avgRevisions.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-ink-500">Across current dataset</p>
            </div>
            {result.error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {result.error}. Showing available data only.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Overdue projects">
        <div className="mt-4 grid gap-3">
          {metrics.overdueProjects.length ? (
            metrics.overdueProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-xl border border-ink-900/10 bg-white/75 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{project.title}</p>
                  <p className="text-xs text-ink-500">Due {formatDueDate(project.due_at)}</p>
                </div>
                <StatusPill status={project.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No overdue projects.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
