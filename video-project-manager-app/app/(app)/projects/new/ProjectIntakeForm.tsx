"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type IntakeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

type IntakeFormProps = {
  action: (prevState: IntakeState, formData: FormData) => Promise<IntakeState>;
  initialState: IntakeState;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save project"}
    </button>
  );
}

export function ProjectIntakeForm({ action, initialState }: IntakeFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-2">
      <div className="glass-panel rounded-xl p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-300">Project details</h3>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Title
            <input
              name="title"
              required
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="123 Main St - Listing Video"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Client
            <input
              name="client"
              required
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="Acme Realty"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Project type
            <input
              name="type"
              required
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="Listing Video"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Due date
            <input
              name="due_at"
              type="date"
              required
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Raw footage URL
            <input
              name="raw_footage_url"
              required
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="https://drive.google.com/..."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Final deliverable URL
            <input
              name="final_delivery_url"
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="https://frame.io/..."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Priority
            <select name="priority" className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900">
              <option value="normal">Normal</option>
              <option value="rush">Rush</option>
            </select>
          </label>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 shadow-card">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-300">Deliverables</h3>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Deliverable list
            <textarea
              name="deliverables"
              required
              className="min-h-[140px] rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="Main video, social cut, teaser"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Notes
            <textarea
              name="notes"
              className="min-h-[120px] rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="Brand notes, pacing, music preferences"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Brand assets URL
            <input
              name="brand_assets_url"
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="https://drive.google.com/..."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-ink-500">
            Music assets URL
            <input
              name="music_assets_url"
              className="rounded-lg border border-ink-900/10 bg-white/80 px-3 py-2 text-ink-900"
              placeholder="https://drive.google.com/..."
            />
          </label>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 shadow-card lg:col-span-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink-500">
            This will create the project, client (if new), deliverables, and an activity log entry.
          </p>
          <div className="flex items-center gap-4">
            {state.status !== "idle" ? (
              <p className={`text-xs ${state.status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {state.message}
              </p>
            ) : null}
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  );
}
