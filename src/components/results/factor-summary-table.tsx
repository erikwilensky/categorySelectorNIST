import React from "react";

interface FactorRow {
  factorId: string;
  factorName: string;
  category: "core" | "secondary" | "blue_sky";
  selectionCount: number;
  averageRank: number | null;
  averageStrength: number | null;
  averagePoints: number;
  consensusLabel: string;
}

interface FactorSummaryTableProps {
  rows: FactorRow[];
  onSelectFactor?: (factorId: string) => void;
}

export function FactorSummaryTable({
  rows,
  onSelectFactor
}: FactorSummaryTableProps) {
  if (!rows.length) {
    return (
      <p className="text-xs text-[#4F529B]">
        No factors match the current filters yet.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wide text-[#4F529B]">
          <tr>
            <th className="px-2 py-1 font-medium">Factor</th>
            <th className="px-2 py-1 font-medium text-right">Category</th>
            <th className="px-2 py-1 font-medium text-right">Selections</th>
            <th className="px-2 py-1 font-medium text-right">Avg. Rank</th>
            <th className="px-2 py-1 font-medium text-right">Avg. Strength</th>
            <th className="px-2 py-1 font-medium text-right">Avg. Points</th>
            <th className="px-2 py-1 font-medium text-right">Consensus</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr
              key={f.factorId}
              className="cursor-pointer bg-white text-[#333333] shadow-sm ring-1 ring-[#4F529B]/60 hover:bg-[#F4F7FB]"
              onClick={() => onSelectFactor?.(f.factorId)}
            >
              <td className="px-2 py-1.5">{f.factorName}</td>
              <td className="px-2 py-1.5 text-right capitalize">
                {f.category.replace("_", " ")}
              </td>
              <td className="px-2 py-1.5 text-right">{f.selectionCount}</td>
              <td className="px-2 py-1.5 text-right">
                {f.averageRank != null ? f.averageRank.toFixed(2) : "—"}
              </td>
              <td className="px-2 py-1.5 text-right">
                {f.averageStrength != null ? f.averageStrength.toFixed(2) : "—"}
              </td>
              <td className="px-2 py-1.5 text-right">
                {f.averagePoints.toFixed(1)}
              </td>
              <td className="px-2 py-1.5 text-right">{f.consensusLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

