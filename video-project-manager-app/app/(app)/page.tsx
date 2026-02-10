import { SectionCard } from "@/components/SectionCard";
import { StatusPill } from "@/components/StatusPill";

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

export default function OverviewPage() {
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
        <SectionCard title="Today’s focus">
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
              <p className="mt-3 text-2xl font-semibold">2 projects</p>
              <p className="mt-2 text-xs text-white/70">Escalate to QC today</p>
            </div>
            <div className="rounded-xl border border-ink-900/10 bg-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-300">Avg turnaround</p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">2.6 days</p>
              <p className="mt-2 text-xs text-ink-500">Assigned to QC</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
