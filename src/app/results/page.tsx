 "use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface FactorAggregate {
  factorId: string;
  factorName: string;
  selectionCount: number;
  averageRank: number | null;
  averageStrength: number | null;
  consensus: "high" | "mixed" | "low";
}

export default function ResultsPage() {
  const [aggregates, setAggregates] = useState<FactorAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/results");
        if (!res.ok) throw new Error("Failed to load results");
        const json = (await res.json()) as { factors: FactorAggregate[] };
        if (!cancelled) {
          setAggregates(json.factors);
        }
      } catch {
        if (!cancelled) setAggregates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const mostSelected = [...aggregates]
    .sort((a, b) => b.selectionCount - a.selectionCount)
    .slice(0, 10);

  const highestPriority = [...aggregates]
    .filter((f) => f.averageRank != null)
    .sort((a, b) => (a.averageRank ?? 0) - (b.averageRank ?? 0))
    .slice(0, 10);

  const strongestApplied = [...aggregates]
    .filter((f) => f.averageStrength != null)
    .sort((a, b) => (b.averageStrength ?? 0) - (a.averageStrength ?? 0))
    .slice(0, 10);

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Live workshop results
        </h2>
        <p className="text-sm text-slate-600">
          View which factors are most commonly selected, where they tend to sit
          in priority stacks, and how strongly they are applied.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Most Selected Factors
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Factors ranked by how often they appear in finalized stacks.
          </p>
          <div className="h-64">
            {loading ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : mostSelected.length === 0 ? (
              <p className="text-xs text-slate-500">
                Results will appear as participants finalize.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostSelected}
                  margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="factorName"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="selectionCount" fill="#1d4ed8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Strongest Applied Factors
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Factors ordered by average strength value.
          </p>
          <div className="h-64">
            {loading ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : strongestApplied.length === 0 ? (
              <p className="text-xs text-slate-500">
                Results will appear as participants finalize.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={strongestApplied}
                  margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="factorName"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="averageStrength" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">
          Consensus Table
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          For each factor, see how often it is selected and how strongly it
          tends to be applied.
        </p>
        <div className="max-h-80 overflow-y-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-1 font-medium">Factor</th>
                <th className="px-2 py-1 font-medium text-right">
                  Selections
                </th>
                <th className="px-2 py-1 font-medium text-right">
                  Avg. Rank
                </th>
                <th className="px-2 py-1 font-medium text-right">
                  Avg. Strength
                </th>
                <th className="px-2 py-1 font-medium text-right">
                  Consensus
                </th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((f) => (
                <tr
                  key={f.factorId}
                  className="bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                >
                  <td className="px-2 py-1.5">{f.factorName}</td>
                  <td className="px-2 py-1.5 text-right">
                    {f.selectionCount}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {f.averageRank ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {f.averageStrength ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right capitalize">
                    {f.consensus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

