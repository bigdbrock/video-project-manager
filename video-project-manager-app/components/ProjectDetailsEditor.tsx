"use client";

import { useActionState, useEffect, useState } from "react";

type ProjectDetails = {
  title: string;
  address: string | null;
  type: string | null;
  priority: string | null;
  notes?: string | null;
  raw_footage_url: string | null;
  brand_assets_url: string | null;
  music_assets_url: string | null;
  preview_url: string | null;
  final_delivery_url: string | null;
};

export type SaveState = {
  status: "idle" | "saving" | "success" | "error";
  message?: string;
};

type Props = {
  canEdit: boolean;
  project: ProjectDetails;
  action: (prevState: SaveState, formData: FormData) => Promise<SaveState>;
};

export function ProjectDetailsEditor({ canEdit, project, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, { status: "idle" });
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      setShowToast(true);
      const timer = window.setTimeout(() => setShowToast(false), 2200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.status]);

  if (!canEdit) return null;

  return (
    <div className="mt-6 rounded-xl border border-ink-900/10 bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Project details</p>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <button type="button" onClick={() => setIsOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-ink-400">
              Cancel
            </button>
          ) : (
            <button type="button" onClick={() => setIsOpen(true)} className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
              Edit project details
            </button>
          )}
        </div>
      </div>

      {showToast ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Saved
        </div>
      ) : null}

      {isOpen ? (
        <form action={formAction} className="mt-3 grid gap-3 text-sm text-ink-700 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-ink-500 md:col-span-2">
            Title
            <input name="title" defaultValue={project.title} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Address
            <input name="address" defaultValue={project.address ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Type
            <input name="type" defaultValue={project.type ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Priority
            <select name="priority" defaultValue={project.priority ?? "normal"} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2">
              <option value="normal">Normal</option>
              <option value="rush">Rush</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500 md:col-span-2">
            Raw footage URL
            <input
              name="raw_footage_url"
              defaultValue={project.raw_footage_url ?? ""}
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
              placeholder="https://drive.google.com/..."
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500 md:col-span-2">
            Project notes
            <textarea
              name="notes"
              defaultValue={project.notes ?? ""}
              className="min-h-[90px] rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2"
              placeholder="Brand notes, pacing, references, constraints..."
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Brand assets URL
            <input name="brand_assets_url" defaultValue={project.brand_assets_url ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Music assets URL
            <input name="music_assets_url" defaultValue={project.music_assets_url ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Preview URL
            <input name="preview_url" defaultValue={project.preview_url ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-2 text-xs text-ink-500">
            Final delivery URL
            <input name="final_delivery_url" defaultValue={project.final_delivery_url ?? ""} className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2" />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-full bg-ink-900 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white md:col-span-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
