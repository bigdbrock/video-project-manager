import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ProjectDetailsEditor } from "@/components/ProjectDetailsEditor";
import type { SaveState } from "@/components/ProjectDetailsEditor";
import { StatusPill } from "@/components/StatusPill";
import { ProjectChatPanel } from "@/components/ProjectChatPanel";
import type { ChatMessage } from "@/components/ProjectChatPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

const fallback = {
  project: {
    id: "fallback",
    title: "ACME - 12 Oak St - Main Edit",
    status: "EDITING",
    address: "12 Oak St",
    type: "Branding",
    priority: "normal",
    due_at: "2026-02-12",
    assigned_editor_id: "Editor One",
    notes: "Capture natural pacing and warm color grade.",
    raw_footage_url: "drive.google.com/acme/12-oak/raw",
    brand_assets_url: "drive.google.com/acme/brand",
    music_assets_url: "drive.google.com/acme/music",
    preview_url: "",
    final_delivery_url: "",
    created_by: "fallback",
    needs_info: false,
    needs_info_note: "",
  },
  deliverables: [
    { id: "d1", label: "Main video", specs: "1080p, 30fps", completed: false },
    { id: "d2", label: "Vertical cut", specs: "1080x1920", completed: false },
    { id: "d3", label: "Social teaser", specs: "15s", completed: true },
  ],
  messages: [
    {
      id: "m1",
      sender_id: "QC",
      sender_name: "QC",
      created_at: "2026-02-10T10:12:00Z",
      message: "Please prioritize the kitchen walkthrough segment.",
    },
    {
      id: "m2",
      sender_id: "Editor",
      sender_name: "Editor",
      created_at: "2026-02-10T10:25:00Z",
      message: "Got it. I will update and resubmit by tomorrow.",
    },
    {
      id: "m3",
      sender_id: "QC",
      sender_name: "QC",
      created_at: "2026-02-10T11:02:00Z",
      message: "Also tighten the drone opener to 6 seconds.",
    },
  ],
  revisions: [
    { id: "r1", created_at: "2026-02-10T09:30:00Z", reason_tags: ["Color", "Stabilization"], notes: "Soften highlights." },
  ],
  activity: [
    { id: "a1", created_at: "2026-02-10T08:20:00Z", action: "PROJECT_CREATED" },
    { id: "a2", created_at: "2026-02-10T09:30:00Z", action: "REVISION_REQUESTED" },
  ],
  editors: [
    { id: "editor-1", full_name: "Editor One" },
    { id: "editor-2", full_name: "Editor Two" },
  ],
};

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  address: string | null;
  type: string | null;
  priority: string | null;
  due_at: string | null;
  assigned_editor_id: string | null;
  notes: string | null;
  raw_footage_url: string | null;
  brand_assets_url: string | null;
  music_assets_url: string | null;
  preview_url: string | null;
  final_delivery_url: string | null;
  created_by: string | null;
  needs_info: boolean;
  needs_info_note: string | null;
};

type DeliverableRow = {
  id: string;
  label: string;
  specs: string | null;
  completed: boolean;
};

type RevisionRow = {
  id: string;
  created_at: string;
  reason_tags: string[];
  notes: string | null;
};

type ActivityRow = {
  id: string;
  created_at: string;
  action: string;
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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

async function getProjectData(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    let { data: project, error } = await supabase
      .from("projects")
      .select(
        "id,title,status,address,type,priority,due_at,assigned_editor_id,notes,raw_footage_url,brand_assets_url,music_assets_url,preview_url,final_delivery_url,created_by,needs_info,needs_info_note"
      )
      .eq("id", id)
      .maybeSingle();

    if (error?.message.includes("column projects.needs_info does not exist") || error?.message.includes("column projects.notes does not exist")) {
      const fallbackProject = await supabase
        .from("projects")
        .select(
          "id,title,status,address,type,priority,due_at,assigned_editor_id,raw_footage_url,brand_assets_url,music_assets_url,preview_url,final_delivery_url,created_by"
        )
        .eq("id", id)
        .maybeSingle();
      project = fallbackProject.data
        ? ({ ...fallbackProject.data, notes: null, needs_info: false, needs_info_note: null } as ProjectRow)
        : null;
      error = fallbackProject.error;
    }

    if (error) {
      return { data: null, error: error.message };
    }

    if (!project) {
      return { data: null, error: "not_found" };
    }

    const [{ data: deliverables }, { data: messages }, { data: revisions }, { data: activity }, { data: editors }] =
      await Promise.all([
        supabase
          .from("deliverables")
          .select("id,label,specs,completed")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("project_messages")
          .select("id,sender_id,created_at,message,sender:profiles(full_name)")
          .eq("project_id", id)
          .order("created_at", { ascending: true })
          .limit(50),
        supabase
          .from("revisions")
          .select("id,created_at,reason_tags,notes")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("activity_log")
          .select("id,created_at,action")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name").eq("role", "editor").order("full_name"),
      ]);

    const normalizedMessages = (messages ?? []).map((item: any) => ({
      id: item.id,
      sender_id: item.sender_id,
      sender_name: item.sender?.full_name ?? null,
      created_at: item.created_at,
      message: item.message,
    })) as ChatMessage[];

    return {
      data: {
        project: project as ProjectRow,
        deliverables: (deliverables ?? []) as DeliverableRow[],
        messages: normalizedMessages,
        revisions: (revisions ?? []) as RevisionRow[],
        activity: (activity ?? []) as ActivityRow[],
        editors: (editors ?? []) as EditorRow[],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: "Supabase not configured" };
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = (profile?.role ?? "editor") as UserRole;

  const result = await getProjectData(projectId);

  if (result.error === "not_found") {
    notFound();
  }

  async function assignProject(formData: FormData) {
    "use server";

    const editorId = String(formData.get("assigned_editor_id") || "").trim();
    const dueAt = String(formData.get("due_at") || "").trim();

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        return;
      }

      const { data: current } = await supabaseAction
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .maybeSingle();

      const nextStatus = current?.status === "NEW" ? "ASSIGNED" : current?.status;

      await supabaseAction
        .from("projects")
        .update({
          assigned_editor_id: editorId || null,
          due_at: dueAt || null,
          status: nextStatus,
        })
        .eq("id", projectId);

      await supabaseAction.from("activity_log").insert({
        project_id: projectId,
        actor_id: actionUser.id,
        action: "PROJECT_ASSIGNED",
        meta: { assigned_editor_id: editorId || null, due_at: dueAt || null },
      });
    } catch (error) {
      return;
    }
  }

  async function updateProjectDetails(prevState: SaveState, formData: FormData): Promise<SaveState> {
    "use server";

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        return { status: "error", message: "Not signed in" } satisfies SaveState;
      }

      const { data: actionProfile } = await supabaseAction
        .from("profiles")
        .select("role")
        .eq("id", actionUser.id)
        .maybeSingle();

      let { data: project, error: projectLookupError } = await supabaseAction
        .from("projects")
        .select(
          "id,created_by,title,address,type,priority,notes,raw_footage_url,brand_assets_url,music_assets_url,preview_url,final_delivery_url"
        )
        .eq("id", projectId)
        .maybeSingle();

      let supportsNotes = true;
      if (projectLookupError?.message.includes("column projects.notes does not exist")) {
        supportsNotes = false;
        const fallbackLookup = await supabaseAction
          .from("projects")
          .select(
            "id,created_by,title,address,type,priority,raw_footage_url,brand_assets_url,music_assets_url,preview_url,final_delivery_url"
          )
          .eq("id", projectId)
          .maybeSingle();
        project = fallbackLookup.data ? ({ ...fallbackLookup.data, notes: null } as typeof project) : null;
        projectLookupError = fallbackLookup.error;
      }

      if (projectLookupError) {
        return { status: "error", message: projectLookupError.message } satisfies SaveState;
      }

      if (!project) {
        return { status: "error", message: "Project not found" } satisfies SaveState;
      }

      const canEdit = actionProfile?.role === "admin" || project.created_by === actionUser.id;
      if (!canEdit) {
        return { status: "error", message: "Not allowed" } satisfies SaveState;
      }

      const title = String(formData.get("title") || "").trim();
      const address = String(formData.get("address") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const priority = String(formData.get("priority") || "").trim();
      const notes = String(formData.get("notes") || "").trim();
      const rawFootageUrl = String(formData.get("raw_footage_url") || "").trim();
      const brandAssetsUrl = String(formData.get("brand_assets_url") || "").trim();
      const musicAssetsUrl = String(formData.get("music_assets_url") || "").trim();
      const previewUrl = String(formData.get("preview_url") || "").trim();
      const finalDeliveryUrl = String(formData.get("final_delivery_url") || "").trim();

      const baseUpdate = {
        title: title || project.title,
        address: address || null,
        type: type || project.type,
        priority: priority || project.priority,
        raw_footage_url: rawFootageUrl || project.raw_footage_url,
        brand_assets_url: brandAssetsUrl || null,
        music_assets_url: musicAssetsUrl || null,
        preview_url: previewUrl || null,
        final_delivery_url: finalDeliveryUrl || null,
      };

      const updatePayload = supportsNotes
        ? { ...baseUpdate, notes: notes || null }
        : baseUpdate;

      await supabaseAction.from("projects").update(updatePayload).eq("id", projectId);

      const deliverableCount = Number(formData.get("deliverables_count") || 0);
      for (let index = 0; index < deliverableCount; index += 1) {
        const deliverableId = String(formData.get(`deliverable_id_${index}`) || "").trim();
        const deliverableLabel = String(formData.get(`deliverable_label_${index}`) || "").trim();
        const deliverableSpecs = String(formData.get(`deliverable_specs_${index}`) || "").trim();
        const deliverableCompleted = formData.get(`deliverable_completed_${index}`) === "on";

        if (!deliverableLabel) {
          continue;
        }

        if (deliverableId) {
          await supabaseAction
            .from("deliverables")
            .update({
              label: deliverableLabel,
              specs: deliverableSpecs || null,
              completed: deliverableCompleted,
            })
            .eq("id", deliverableId)
            .eq("project_id", projectId);
        } else {
          await supabaseAction.from("deliverables").insert({
            project_id: projectId,
            label: deliverableLabel,
            specs: deliverableSpecs || null,
            completed: deliverableCompleted,
          });
        }
      }

      await supabaseAction.from("activity_log").insert({
        project_id: projectId,
        actor_id: actionUser.id,
        action: "PROJECT_UPDATED",
      });

      revalidatePath(`/projects/${projectId}`);
      revalidatePath("/projects");

      return { status: "success" } satisfies SaveState;
    } catch (error) {
      return { status: "error", message: "Failed to update" } satisfies SaveState;
    }
  }

  async function updateEditorWork(formData: FormData) {
    "use server";

    const status = String(formData.get("status") || "").trim();
    const previewUrl = String(formData.get("preview_url") || "").trim();
    const finalUrl = String(formData.get("final_delivery_url") || "").trim();

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        return;
      }

      const { data: current } = await supabaseAction
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .maybeSingle();

      const update: Record<string, string | null> = {
        preview_url: previewUrl || null,
        final_delivery_url: finalUrl || null,
      };

      if (status) {
        update.status = status;
      }

      await supabaseAction.from("projects").update(update).eq("id", projectId);

      if (status && status !== current?.status) {
        await supabaseAction.from("activity_log").insert({
          project_id: projectId,
          actor_id: actionUser.id,
          action: status === "QC" ? "EDITOR_SUBMITTED_QC" : "EDITOR_STATUS_UPDATED",
          meta: { status },
        });
      }
    } catch (error) {
      return;
    }
  }

  async function sendMessage(formData: FormData) {
    "use server";

    const message = String(formData.get("message") || "").trim();
    if (!message) return;

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        return;
      }

      await supabaseAction.from("project_messages").insert({
        project_id: projectId,
        sender_id: actionUser.id,
        message,
        message_type: "user",
      });

      await supabaseAction.from("activity_log").insert({
        project_id: projectId,
        actor_id: actionUser.id,
        action: "MESSAGE_SENT",
      });
    } catch (error) {
      return;
    }
  }

  async function handleQcDecision(formData: FormData) {
    "use server";

    const decision = String(formData.get("decision") || "").trim();
    const notes = String(formData.get("revision_notes") || "").trim();
    const rawTags = String(formData.get("revision_tags") || "").trim();
    const tags = rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        return;
      }

      const { data: actionProfile } = await supabaseAction
        .from("profiles")
        .select("role")
        .eq("id", actionUser.id)
        .maybeSingle();

      if (!actionProfile || (actionProfile.role !== "admin" && actionProfile.role !== "qc")) {
        return;
      }

      const { data: currentProject } = await supabaseAction
        .from("projects")
        .select("assigned_editor_id,revision_count,status")
        .eq("id", projectId)
        .maybeSingle();

      if (!currentProject) {
        return;
      }

      if (decision === "ready" || decision === "delivered") {
        const nextStatus = decision === "delivered" ? "DELIVERED" : "READY";

        await supabaseAction
          .from("projects")
          .update({
            status: nextStatus,
          })
          .eq("id", projectId);

        await supabaseAction.from("activity_log").insert({
          project_id: projectId,
          actor_id: actionUser.id,
          action: nextStatus === "DELIVERED" ? "PROJECT_DELIVERED" : "PROJECT_READY",
        });

        await supabaseAction.from("project_messages").insert({
          project_id: projectId,
          sender_id: actionUser.id,
          message_type: "system",
          message:
            nextStatus === "DELIVERED"
              ? "QC marked this project as delivered."
              : "QC approved this project and marked it ready.",
        });
      }

      if (decision === "request_revision") {
        if (!notes || tags.length === 0) {
          return;
        }

        await supabaseAction.from("revisions").insert({
          project_id: projectId,
          requested_by: actionUser.id,
          editor_id: currentProject.assigned_editor_id,
          reason_tags: tags,
          notes,
        });

        await supabaseAction
          .from("projects")
          .update({
            status: "REVISION_REQUESTED",
            revision_count: (currentProject.revision_count ?? 0) + 1,
          })
          .eq("id", projectId);

        await supabaseAction.from("activity_log").insert({
          project_id: projectId,
          actor_id: actionUser.id,
          action: "REVISION_REQUESTED",
          meta: {
            reason_tags: tags,
          },
        });

        await supabaseAction.from("project_messages").insert({
          project_id: projectId,
          sender_id: actionUser.id,
          message_type: "system",
          message: `Revision requested: ${tags.join(", ")}.`,
          metadata: {
            notes,
          },
        });
      }

      revalidatePath(`/projects/${projectId}`);
      revalidatePath("/projects");
    } catch (error) {
      return;
    }
  }

  async function deleteProject() {
    "use server";

    try {
      const supabaseAction = await createServerSupabaseClient();
      const {
        data: { user: actionUser },
      } = await supabaseAction.auth.getUser();

      if (!actionUser) {
        return;
      }

      const { data: actionProfile } = await supabaseAction
        .from("profiles")
        .select("role")
        .eq("id", actionUser.id)
        .maybeSingle();

      if (actionProfile?.role !== "admin") {
        return;
      }

      await supabaseAction.from("projects").delete().eq("id", projectId);
      redirect("/projects");
    } catch (error) {
      return;
    }
  }

  const data = result.data ?? fallback;
  const canEditProject = role === "admin" || data.project.created_by === user?.id;

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
              <li>Notes: {data.project.notes ?? "Not set"}</li>
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

        <ProjectDetailsEditor
          canEdit={canEditProject}
          project={data.project}
          deliverables={data.deliverables}
          action={updateProjectDetails}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Revision history</p>
            <div className="mt-3 space-y-3 text-sm text-ink-700">
              {data.revisions.length ? (
                data.revisions.map((revision) => (
                  <div key={revision.id} className="rounded-lg border border-ink-900/5 bg-white/80 p-3">
                    <p className="text-xs text-ink-300">{formatDateTime(revision.created_at)}</p>
                    <p className="mt-1 font-semibold">{revision.reason_tags?.join(", ") || "Revision"}</p>
                    {revision.notes ? <p className="mt-1 text-xs text-ink-500">{revision.notes}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-500">No revisions logged yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Activity log</p>
            <div className="mt-3 space-y-3 text-sm text-ink-700">
              {data.activity.length ? (
                data.activity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-ink-500">
                    <span>{item.action}</span>
                    <span>{formatDateTime(item.created_at)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-500">No activity yet.</p>
              )}
            </div>
          </div>
        </div>

        {(role === "admin" || role === "qc") ? (
          <div className="mt-6 rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">QC actions</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-xs text-ink-500">
                Approve this project or request a structured revision.
              </div>
              <form action={handleQcDecision}>
                <input type="hidden" name="decision" value="ready" />
                <button type="submit" className="h-10 rounded-full bg-ink-900 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  Mark Ready
                </button>
              </form>
              <form action={handleQcDecision}>
                <input type="hidden" name="decision" value="delivered" />
                <button type="submit" className="h-10 rounded-full border border-ink-900/20 bg-white px-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-900">
                  Mark Delivered
                </button>
              </form>
            </div>
            <form action={handleQcDecision} className="mt-4 grid gap-3 text-sm text-ink-700">
              <input type="hidden" name="decision" value="request_revision" />
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Revision tags (comma separated)
                <input
                  name="revision_tags"
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
                  placeholder="Color, pacing, audio"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Notes
                <textarea
                  name="revision_notes"
                  className="min-h-[90px] rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
                  placeholder="What should change before approval?"
                  required
                />
              </label>
              <button type="submit" className="h-10 rounded-full bg-ink-900 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Request Revision
              </button>
            </form>
          </div>
        ) : null}

        {role !== "editor" ? (
          <div className="mt-6 rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Assignment</p>
            <form action={assignProject} className="mt-3 grid gap-3 text-sm text-ink-700 md:grid-cols-[1fr_1fr_auto]">
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Assigned editor
                <select name="assigned_editor_id" defaultValue={data.project.assigned_editor_id ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2">
                  <option value="">Unassigned</option>
                  {data.editors.map((editor) => (
                    <option key={editor.id} value={editor.id}>
                      {editor.full_name ?? "Editor"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Due date
                <input
                  name="due_at"
                  type="date"
                  defaultValue={data.project.due_at ? data.project.due_at.slice(0, 10) : ""}
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
                />
              </label>
              <button type="submit" className="h-10 rounded-full bg-ink-900 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Assign
              </button>
            </form>
            {role === "admin" ? (
              <form action={deleteProject} className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                <span>Delete this project permanently.</span>
                <button type="submit" className="rounded-full bg-rose-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                  Delete
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {role === "editor" ? (
          <div className="mt-6 rounded-xl border border-ink-900/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Editor updates</p>
            <form action={updateEditorWork} className="mt-3 grid gap-3 text-sm text-ink-700">
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Status
                <select name="status" defaultValue={data.project.status} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2">
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="EDITING">EDITING</option>
                  <option value="QC">QC</option>
                  <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Preview URL
                <input
                  name="preview_url"
                  defaultValue={data.project.preview_url ?? ""}
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
                  placeholder="https://frame.io/..."
                />
              </label>
              <label className="flex flex-col gap-2 text-xs text-ink-500">
                Final delivery URL
                <input
                  name="final_delivery_url"
                  defaultValue={data.project.final_delivery_url ?? ""}
                  className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
                  placeholder="https://frame.io/..."
                />
              </label>
              <button type="submit" className="h-10 rounded-full bg-ink-900 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Update
              </button>
            </form>
          </div>
        ) : null}
      </section>

      <ProjectChatPanel
        projectId={data.project.id}
        initialMessages={data.messages}
        onSend={sendMessage}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}


