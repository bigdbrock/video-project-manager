"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WorkloadChartRow = {
  name: string;
  total: number;
  NEW: number;
  ASSIGNED: number;
  EDITING: number;
  QC: number;
  REVISION_REQUESTED: number;
  READY: number;
  ON_HOLD: number;
};

type Props = {
  rows: WorkloadChartRow[];
};

const statusColors: Record<string, string> = {
  NEW: "#9ca3af",
  ASSIGNED: "#3c67b1",
  EDITING: "#f59e0b",
  QC: "#0ea5e9",
  REVISION_REQUESTED: "#e11d48",
  READY: "#22c55e",
  ON_HOLD: "#f97316",
};

export function OperationsCharts({ rows }: Props) {
  if (!rows.length) {
    return <p className="text-sm text-ink-500">No chart data yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-ink-900/10 bg-white/75 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Total assigned by editor</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6dce7" />
              <XAxis dataKey="name" tick={{ fill: "#3b465a", fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#3b465a", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3c67b1" radius={[6, 6, 0, 0]}>
                {rows.map((row) => (
                  <Cell key={row.name} fill="#3c67b1" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-ink-900/10 bg-white/75 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-300">Status mix by editor</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6dce7" />
              <XAxis dataKey="name" tick={{ fill: "#3b465a", fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#3b465a", fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {Object.entries(statusColors).map(([status, color]) => (
                <Bar key={status} dataKey={status} stackId="status" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
