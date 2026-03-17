import React from "react";

interface ResponseRow {
  responseId: string;
  submittedAt: string;
  factorCount: number;
  topFactor: string | null;
  topThreeFactors: string[];
  averageStrength: number | null;
  totalPointsUsed: number;
  rigidityScore: number | null;
}

interface ResponseExplorerTableProps {
  rows: ResponseRow[];
}

export function ResponseExplorerTable({
  rows
}: ResponseExplorerTableProps) {
  if (!rows.length) {
    return (
      <p className="text-xs text-[#4F529B]">
        No finalized stacks match the current filters yet.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wide text-[#4F529B]">
          <tr>
            <th className="px-2 py-1 font-medium">Response</th>
            <th className="px-2 py-1 font-medium">Submitted</th>
            <th className="px-2 py-1 font-medium text-right">Factors</th>
            <th className="px-2 py-1 font-medium text-right">Top factor</th>
            <th className="px-2 py-1 font-medium text-right">Top 3</th>
            <th className="px-2 py-1 font-medium text-right">Avg. strength</th>
            <th className="px-2 py-1 font-medium text-right">Points used</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.responseId}
              className="bg-white text-[#333333] shadow-sm ring-1 ring-[#4F529B]/60"
            >
              <td className="px-2 py-1.5">
                <span className="font-mono text-[11px]">
                  {r.responseId.slice(0, 8)}
                </span>
              </td>
              <td className="px-2 py-1.5">
                {new Date(r.submittedAt).toLocaleString()}
              </td>
              <td className="px-2 py-1.5 text-right">{r.factorCount}</td>
              <td className="px-2 py-1.5 text-right">
                {r.topFactor ?? "—"}
              </td>
              <td className="px-2 py-1.5 text-right">
                {r.topThreeFactors.join(" | ")}
              </td>
              <td className="px-2 py-1.5 text-right">
                {r.averageStrength != null
                  ? r.averageStrength.toFixed(2)
                  : "—"}
              </td>
              <td className="px-2 py-1.5 text-right">{r.totalPointsUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

