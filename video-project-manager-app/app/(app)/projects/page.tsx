import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchParams = {
  editor?: string;
  priority?: string;
  due?: string;
};

const fallbackColumns = [
  {
    status: "NEW",
    items: [
      { id: "1", title: "Bluebird - 301 Grove St", due: "Feb 16" },
      { id: "2", title: "Canyon - 88 Ridge Ln", due: "Feb 18" },
    ],
  },
  {
    status: "EDITING",
    items: [
      { id: "3", title: "Acme - 12 Oak St", due: "Feb 12" },
      { id: "4", title: "Canyon - 18 Desert Way", due: "Feb 17" },
    ],
  },
  {
    status: "QC",
    items: [
      { id: "5", title: "Canyon - 66 Mesa Dr", due: "Feb 11" },
      { id: "6", title: "Bluebird - 9 Sunset Blvd", due: "Feb 13" },
    ],
  },
  {
    status: "REVISION_REQUESTED",
    items: [{ id: "7", title: "Bluebird - 55 Ridge Ln", due: "Feb 11" }],
  },
];

const statusOrder = [
  "NEW",
  "ASSIGNED",
  "EDITING",
  "QC",
  "REVISION_REQUESTED",
  "READY",
  "DELIVERED",
  "ARCHIVED",
  "ON_HOLD",
];

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  assigned_editor_id: string | null;
  priority: string | null;
};

type EditorRow = {
  id: string;
  full_name: string | null;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDueRangeFilter(due: string | undefined) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (due === "3d") {
    const limit = new Date(startOfDay);
    limit.setDate(limit.getDate() + 3);
    return { from: startOfDay.toISOString(), to: limit.toISOString() };
  }

  if (due === "7d") {
    const limit = new Date(startOfDay);
    limit.setDate(limit.getDate() + 7);
    return { from: startOfDay.toISOString(), to: limit.toISOString() };
  }

  if (due === "overdue") {
    return { to: startOfDay.toISOString() };
  }

  return null;
}

async function getProjects(filters: SearchParams) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("projects")
      .select("id,title,status,due_at,assigned_editor_id,priority")
      .order("due_at", { ascending: true, nullsFirst: false });

    if (filters.editor) {
      query = query.eq("assigned_editor_id", filters.editor);
    }

    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    const dueRange = getDueRangeFilter(filters.due);
    if (dueRange?.from) {
      query = query.gte("due_at", dueRange.from);
    }
    if (dueRange?.to) {
      query = query.lte("due_at", dueRange.to);
    }

    const { data, error } = await query;
    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as ProjectRow[], error: null };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

async function getEditors() {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name")
      .eq("role", "editor")
      .order("full_name", { ascending: true });

    return (data ?? []) as EditorRow[];
  } catch (error) {
    return [] as EditorRow[];
  }
}

function buildFilterUrl(params: SearchParams, next: Partial<SearchParams>) {
  const merged = { ...params, ...next };
  const entries = Object.entries(merged).filter(([, value]) => value && value !== "all");
  const search = new URLSearchParams(entries as [string, string][]).toString();
  return search ? `/projects?${search}` : "/projects";
}

export default async function ProjectsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ?? {};
  const [result, editors] = await Promise.all([getProjects(params), getEditors()]);

  const grouped = statusOrder.map((status) => ({ status, items: [] as ProjectRow[] }));

  if (result.data) {
    result.data.forEach((project) => {
      const column = grouped.find((item) => item.status === project.status);
      if (column) {
        column.items.push(project);
      }
    });
  }

  const columns = result.data ? grouped.filter((column) => column.items.length > 0) : fallbackColumns;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Pipeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Projects Kanban
          </h2>
          <p className="mt-2 text-sm text-ink-500">Filter by editor, priority, and due window.</p>
        </div>
        <form
          action="/projects"
          method="get"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-xs text-ink-500"
        >
          <span className="uppercase tracking-[0.2em] text-ink-300">Filters</span>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/80 px-3 py-1">
              <span>Editor</span>
              <select name="editor" defaultValue={params.editor ?? "all"} className="bg-transparent text-xs text-ink-700">
                <option value="all">All</option>
                {editors.map((editor) => (
                  <option key={editor.id} value={editor.id}>
                    {editor.full_name ?? "Editor"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/80 px-3 py-1">
              <span>Priority</span>
              <select name="priority" defaultValue={params.priority ?? "all"} className="bg-transparent text-xs text-ink-700">
                <option value="all">All</option>
                <option value="normal">Normal</option>
                <option value="rush">Rush</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/80 px-3 py-1">
              <span>Due</span>
              <select name="due" defaultValue={params.due ?? "all"} className="bg-transparent text-xs text-ink-700">
                <option value="all">All</option>
                <option value="3d">Next 3 days</option>
                <option value="7d">Next 7 days</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="rounded-full bg-ink-900 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
          >
            Apply
          </button>
          <Link
            href="/projects"
            className="rounded-full border border-ink-900/10 bg-white/80 px-3 py-1 text-xs text-ink-700"
          >
            Reset
          </Link>
        </form>
        <div className="flex flex-wrap gap-2 text-xs text-ink-500">
          {editors.map((editor) => (
            <Link
              key={editor.id}
              href={buildFilterUrl(params, { editor: editor.id })}
              className={
                params.editor === editor.id
                  ? "rounded-full bg-ink-900 px-3 py-1 text-white"
                  : "rounded-full border border-ink-900/10 bg-white/80 px-3 py-1"
              }
            >
              {editor.full_name ?? "Editor"}
            </Link>
          ))}
          <Link
            href={buildFilterUrl(params, { priority: "rush" })}
            className={
              params.priority === "rush"
                ? "rounded-full bg-ink-900 px-3 py-1 text-white"
                : "rounded-full border border-ink-900/10 bg-white/80 px-3 py-1"
            }
          >
            Rush only
          </Link>
          <Link
            href={buildFilterUrl(params, { due: "overdue" })}
            className={
              params.due === "overdue"
                ? "rounded-full bg-ink-900 px-3 py-1 text-white"
                : "rounded-full border border-ink-900/10 bg-white/80 px-3 py-1"
            }
          >
            Overdue
          </Link>
        </div>
        {result.error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {result.error}. Showing fallback data.
          </div>
        ) : null}
      </header>
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.status} className="glass-panel rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between">
              <StatusPill status={column.status} />
              <span className="text-xs text-ink-300">{column.items.length}</span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {column.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.id}`}
                  className="rounded-xl border border-ink-900/10 bg-white/70 p-4 transition hover:border-ink-900/20"
                >
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-xs text-ink-500">Due {"due" in item ? item.due : formatDueDate(item.due_at)}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
