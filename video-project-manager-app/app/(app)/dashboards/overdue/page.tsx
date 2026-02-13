import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OperationsCharts } from "@/components/OperationsCharts";

type ProjectRow = {
  id: string;
  title: string;
  due_at: string | null;
  assigned_editor_id: string | null;
  status: string;
  revision_count: number;
  needs_info: boolean;
};

type EditorRow = {
  id: string;
  full_name: string | null;
};

type ActivityRow = {
  project_id: string;
  action: string;
  created_at: string;
};

const nonTerminalStatuses = ["NEW", "ASSIGNED", "EDITING", "QC", "REVISION_REQUESTED", "READY", "ON_HOLD"];

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function average(numbers: number[]) {
  if (!numbers.length) return null;
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return total / numbers.length;
}

async function getDashboardData() {
  try {
    const supabase = await createServerSupabaseClient();
    const [{ data: projects, error: projectsError }, { data: editors }, { data: activity }] = await Promise.all([
      supabase
        .from("projects")
        .select("id,title,due_at,assigned_editor_id,status,revision_count,needs_info")
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("profiles").select("id,full_name").eq("role", "editor").order("full_name"),
      supabase
        .from("activity_log")
        .select("project_id,action,created_at")
        .in("action", ["PROJECT_ASSIGNED", "EDITOR_SUBMITTED_QC"])
        .order("created_at", { ascending: true }),
    ]);

    if (projectsError) {
      return { data: null, error: projectsError.message };
    }

    const projectRows = (projects ?? []) as ProjectRow[];
    const editorRows = (editors ?? []) as EditorRow[];
    const activityRows = (activity ?? []) as ActivityRow[];

    const overdue = projectRows.filter(
      (project) =>
        !project.needs_info &&
        project.due_at &&
        !["DELIVERED", "ARCHIVED"].includes(project.status) &&
        new Date(project.due_at).getTime() < Date.now()
    );

    const editorMap = new Map(editorRows.map((editor) => [editor.id, editor.full_name ?? "Unnamed editor"]));
    const workload = editorRows.map((editor) => {
      const assigned = projectRows.filter((project) => project.assigned_editor_id === editor.id);
      const byStatus = nonTerminalStatuses.reduce<Record<string, number>>((acc, status) => {
        acc[status] = assigned.filter((project) => project.status === status).length;
        return acc;
      }, {});
      return {
        id: editor.id,
        name: editor.full_name ?? "Unnamed editor",
        total: assigned.length,
        byStatus,
      };
    });

    const slaEligibleProjectIds = new Set(
      projectRows.filter((project) => !project.needs_info).map((project) => project.id)
    );
    const projectTimeline = new Map<string, { assignedAt?: number; qcAt?: number }>();
    for (const event of activityRows) {
      if (!slaEligibleProjectIds.has(event.project_id)) continue;
      const row = projectTimeline.get(event.project_id) ?? {};
      const createdAt = new Date(event.created_at).getTime();
      if (event.action === "PROJECT_ASSIGNED" && row.assignedAt === undefined) {
        row.assignedAt = createdAt;
      }
      if (event.action === "EDITOR_SUBMITTED_QC" && row.qcAt === undefined) {
        row.qcAt = createdAt;
      }
      projectTimeline.set(event.project_id, row);
    }

    const cycleTimes = Array.from(projectTimeline.values())
      .filter((item) => item.assignedAt !== undefined && item.qcAt !== undefined && item.qcAt >= item.assignedAt)
      .map((item) => ((item.qcAt ?? 0) - (item.assignedAt ?? 0)) / (1000 * 60 * 60 * 24));

    const avgAssignedToQc = average(cycleTimes);
    const avgRevisions = average(projectRows.map((project) => project.revision_count ?? 0));
    const maxWorkload = Math.max(1, ...workload.map((row) => row.total));
    const workloadChartRows = workload.map((row) => ({
      name: row.name,
      total: row.total,
      NEW: row.byStatus.NEW ?? 0,
      ASSIGNED: row.byStatus.ASSIGNED ?? 0,
      EDITING: row.byStatus.EDITING ?? 0,
      QC: row.byStatus.QC ?? 0,
      REVISION_REQUESTED: row.byStatus.REVISION_REQUESTED ?? 0,
      READY: row.byStatus.READY ?? 0,
      ON_HOLD: row.byStatus.ON_HOLD ?? 0,
    }));

    return {
      data: {
        overdue,
        workload,
        maxWorkload,
        avgAssignedToQc,
        avgRevisions,
        editorMap,
        workloadChartRows,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

export default async function OverdueDashboard() {
  const result = await getDashboardData();
  const data = result.data ?? {
    overdue: [] as ProjectRow[],
    workload: [] as {
      id: string;
      name: string;
      total: number;
      byStatus: Record<string, number>;
    }[],
    maxWorkload: 1,
    avgAssignedToQc: null as number | null,
    avgRevisions: null as number | null,
    editorMap: new Map<string, string>(),
    workloadChartRows: [] as {
      name: string;
      total: number;
      NEW: number;
      ASSIGNED: number;
      EDITING: number;
      QC: number;
      REVISION_REQUESTED: number;
      READY: number;
      ON_HOLD: number;
    }[],
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Dashboards</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Operations
        </h2>
        <p className="mt-2 text-sm text-ink-500">Overdue projects, workload distribution, and flow metrics.</p>
        {result.error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {result.error}. Showing available data only.
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-xl p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Avg ASSIGNED to QC</p>
          <p className="mt-3 text-3xl font-semibold text-ink-900">
            {data.avgAssignedToQc === null ? "N/A" : `${data.avgAssignedToQc.toFixed(1)} days`}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Avg revisions per project</p>
          <p className="mt-3 text-3xl font-semibold text-ink-900">
            {data.avgRevisions === null ? "N/A" : data.avgRevisions.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Charts</p>
        <div className="mt-4">
          <OperationsCharts rows={data.workloadChartRows} />
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Workload by editor</p>
        <div className="mt-4 space-y-3">
          {data.workload.length ? (
            data.workload.map((row) => (
              <div key={row.id} className="rounded-xl border border-ink-900/10 bg-white/75 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-900">{row.name}</span>
                  <span className="text-ink-500">{row.total} assigned</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-sand-100">
                  <div
                    className="h-2 rounded-full bg-ember-500"
                    style={{ width: `${Math.max(4, (row.total / data.maxWorkload) * 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-500">
                  {nonTerminalStatuses.map((status) => (
                    <span key={status} className="rounded-full border border-ink-900/10 bg-white px-2 py-1">
                      {status}: {row.byStatus[status] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No editor workload data yet.</p>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Overdue projects</p>
        <div className="mt-4 grid gap-3">
          {data.overdue.length ? (
            data.overdue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-white/75 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="text-xs text-ink-500">
                    Owner {item.assigned_editor_id ? data.editorMap.get(item.assigned_editor_id) ?? item.assigned_editor_id : "Unassigned"}
                  </p>
                  {item.needs_info ? (
                    <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-800">
                      Needs info
                    </p>
                  ) : null}
                </div>
                <div className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                  Due {formatDueDate(item.due_at)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No overdue projects.</p>
          )}
        </div>
      </div>
    </section>
  );
}
