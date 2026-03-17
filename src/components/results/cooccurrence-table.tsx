import React from "react";

interface CoRow {
  factorAId: string;
  factorAName: string;
  factorBId: string;
  factorBName: string;
  coSelectedCount: number;
  coSelectedPercentage: number;
  conditionalPercentage: number;
}

interface CooccurrenceTableProps {
  rows: CoRow[];
}

export function CooccurrenceTable({ rows }: CooccurrenceTableProps) {
  if (!rows.length) {
    return (
      <p className="text-xs text-[#4F529B]">
        No co-occurrence data yet. Results will appear as more stacks are
        finalized.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wide text-[#4F529B]">
          <tr>
            <th className="px-2 py-1 font-medium">Factor A</th>
            <th className="px-2 py-1 font-medium">Factor B</th>
            <th className="px-2 py-1 font-medium text-right">Co-selected</th>
            <th className="px-2 py-1 font-medium text-right">Co-selected %</th>
            <th className="px-2 py-1 font-medium text-right">
              Conditional % (B | A)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.factorAId}-${row.factorBId}-${index}`}
              className="bg-white text-[#333333] shadow-sm ring-1 ring-[#4F529B]/60"
            >
              <td className="px-2 py-1.5">{row.factorAName}</td>
              <td className="px-2 py-1.5">{row.factorBName}</td>
              <td className="px-2 py-1.5 text-right">
                {row.coSelectedCount}
              </td>
              <td className="px-2 py-1.5 text-right">
                {row.coSelectedPercentage.toFixed(1)}%
              </td>
              <td className="px-2 py-1.5 text-right">
                {row.conditionalPercentage.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

