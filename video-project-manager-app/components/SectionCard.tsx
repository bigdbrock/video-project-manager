import type { ReactNode } from "react";

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-panel rounded-xl p-6 shadow-card">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink-900" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {title}
        </h3>
      </header>
      <div className="mt-4 text-sm text-ink-500">{children}</div>
    </section>
  );
}
