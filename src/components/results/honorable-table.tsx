import React from "react";

interface HonorableRow {
  factorId: string;
  factorName: string;
  category: "core" | "secondary" | "blue_sky";
  honorableCount: number;
  honorableSelectionPercentage: number;
}

interface HonorableTableProps {
  rows: HonorableRow[];
}

export function HonorableTable({ rows }: HonorableTableProps) {
  if (!rows.length) {
    return (
      <p className="text-xs text-[#4F529B]">
        No honorable mentions yet. They will appear here as participants add
        factors to the Honorable mentions list and finalize their stacks.
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
            <th className="px-2 py-1 font-medium text-right">Honorable count</th>
            <th className="px-2 py-1 font-medium text-right">
              Honorable % of stacks
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr
              key={f.factorId}
              className="bg-white text-[#333333] shadow-sm ring-1 ring-[#4F529B]/60"
            >
              <td className="px-2 py-1.5">{f.factorName}</td>
              <td className="px-2 py-1.5 text-right capitalize">
                {f.category.replace("_", " ")}
              </td>
              <td className="px-2 py-1.5 text-right">{f.honorableCount}</td>
              <td className="px-2 py-1.5 text-right">
                {f.honorableSelectionPercentage.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

