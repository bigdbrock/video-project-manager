import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectIntakeForm, type IntakeState } from "./ProjectIntakeForm";

const initialState: IntakeState = { status: "idle" };

function parseDeliverables(raw: string) {
  return raw
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({ label }));
}

export default async function NewProjectPage() {
  async function createProject(prevState: IntakeState, formData: FormData): Promise<IntakeState> {
    "use server";

    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { status: "error", message: "You must be signed in." };
      }

      const title = String(formData.get("title") || "").trim();
      const clientName = String(formData.get("client") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const dueAt = String(formData.get("due_at") || "").trim();
      const rawFootageUrl = String(formData.get("raw_footage_url") || "").trim();
      const finalDeliveryUrl = String(formData.get("final_delivery_url") || "").trim();
      const brandAssetsUrl = String(formData.get("brand_assets_url") || "").trim();
      const musicAssetsUrl = String(formData.get("music_assets_url") || "").trim();
      const priority = String(formData.get("priority") || "normal");
      const notes = String(formData.get("notes") || "").trim();
      const deliverablesRaw = String(formData.get("deliverables") || "").trim();

      if (!title || !clientName || !type || !dueAt || !rawFootageUrl) {
        return { status: "error", message: "Please fill out all required fields." };
      }

      const deliverables = parseDeliverables(deliverablesRaw);
      if (!deliverables.length) {
        return { status: "error", message: "Add at least one deliverable." };
      }

      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("name", clientName)
        .maybeSingle();

      let clientId = existingClient?.id ?? null;
      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({ name: clientName })
          .select("id")
          .single();

        if (clientError || !newClient) {
          return { status: "error", message: clientError?.message ?? "Failed to create client." };
        }

        clientId = newClient.id;
      }

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title,
          client_id: clientId,
          type,
          due_at: dueAt,
          raw_footage_url: rawFootageUrl,
          final_delivery_url: finalDeliveryUrl || null,
          brand_assets_url: brandAssetsUrl || null,
          music_assets_url: musicAssetsUrl || null,
          priority,
          notes: notes || null,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (projectError?.message.includes("column \"notes\" of relation \"projects\" does not exist")) {
        const fallbackInsert = await supabase
          .from("projects")
          .insert({
            title,
            client_id: clientId,
            type,
            due_at: dueAt,
            raw_footage_url: rawFootageUrl,
            final_delivery_url: finalDeliveryUrl || null,
            brand_assets_url: brandAssetsUrl || null,
            music_assets_url: musicAssetsUrl || null,
            priority,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (fallbackInsert.error || !fallbackInsert.data) {
          return { status: "error", message: fallbackInsert.error?.message ?? "Failed to create project." };
        }

        const projectId = fallbackInsert.data.id;
        const deliverableRows = deliverables.map((item) => ({
          project_id: projectId,
          label: item.label,
        }));

        const { error: deliverableError } = await supabase.from("deliverables").insert(deliverableRows);
        if (deliverableError) {
          return { status: "error", message: deliverableError.message };
        }

        if (notes) {
          await supabase.from("activity_log").insert({
            project_id: projectId,
            actor_id: user.id,
            action: "PROJECT_CREATED",
            meta: { notes },
          });
        }

        return { status: "success", message: "Project created successfully." };
      }

      if (projectError || !project) {
        return { status: "error", message: projectError?.message ?? "Failed to create project." };
      }

      const deliverableRows = deliverables.map((item) => ({
        project_id: project.id,
        label: item.label,
      }));

      const { error: deliverableError } = await supabase.from("deliverables").insert(deliverableRows);
      if (deliverableError) {
        return { status: "error", message: deliverableError.message };
      }

      if (notes) {
        await supabase.from("activity_log").insert({
          project_id: project.id,
          actor_id: user.id,
          action: "PROJECT_CREATED",
          meta: { notes },
        });
      }

      return { status: "success", message: "Project created successfully." };
    } catch (error) {
      return { status: "error", message: "Supabase not configured." };
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Intake</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Create Project
        </h2>
        <p className="mt-2 text-sm text-ink-500">Capture everything editors need before work begins.</p>
      </header>

      <ProjectIntakeForm action={createProject} initialState={initialState} />
    </section>
  );
}

