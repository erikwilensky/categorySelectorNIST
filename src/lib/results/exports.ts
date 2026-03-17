import type {
  CooccurrenceRow,
  FactorAggregate,
  ResponseSummary
} from "./types";

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

export function exportFactorSummaryCSV(
  factors: FactorAggregate[]
): string {
  const header = toCsvRow([
    "Factor ID",
    "Factor Name",
    "Category",
    "Description",
    "Selections",
    "Selection %",
    "Avg Rank",
    "Median Rank",
    "Min Rank",
    "Max Rank",
    "Rank Std Dev",
    "Avg Strength",
    "Median Strength",
    "Min Strength",
    "Max Strength",
    "Strength Std Dev",
    "Total Points",
    "Avg Points",
    "Top 3 Count",
    "High Strength Count",
    "Consensus",
    "Disagreement"
  ]);

  const rows = factors.map((f) =>
    toCsvRow([
      f.factorId,
      f.factorName,
      f.category,
      f.description ?? "",
      f.selectionCount,
      f.selectionPercentage.toFixed(1),
      f.averageRank?.toFixed(2) ?? "",
      f.medianRank ?? "",
      f.minRank ?? "",
      f.maxRank ?? "",
      f.rankStdDev?.toFixed(2) ?? "",
      f.averageStrength?.toFixed(2) ?? "",
      f.medianStrength ?? "",
      f.minStrength ?? "",
      f.maxStrength ?? "",
      f.strengthStdDev?.toFixed(2) ?? "",
      f.totalPoints,
      f.averagePoints.toFixed(2),
      f.top3Count,
      f.highStrengthCount,
      f.consensusLabel,
      f.disagreementLabel
    ])
  );

  return [header, ...rows].join("\n");
}

export function exportResponseSummaryCSV(
  responses: ResponseSummary[]
): string {
  const header = toCsvRow([
    "Response ID",
    "Submitted At",
    "Factor Count",
    "Top Factor",
    "Top 3 Factors",
    "Avg Strength",
    "Total Points Used",
    "Rigidity Score"
  ]);

  const rows = responses.map((r) =>
    toCsvRow([
      r.responseId,
      r.submittedAt,
      r.factorCount,
      r.topFactor ?? "",
      r.topThreeFactors.join(" | "),
      r.averageStrength?.toFixed(2) ?? "",
      r.totalPointsUsed,
      r.rigidityScore != null ? r.rigidityScore.toFixed(2) : ""
    ])
  );

  return [header, ...rows].join("\n");
}

export function exportCooccurrenceCSV(
  rows: CooccurrenceRow[]
): string {
  const header = toCsvRow([
    "Factor A ID",
    "Factor A Name",
    "Factor B ID",
    "Factor B Name",
    "Co-selected Count",
    "Co-selected %",
    "Conditional % (B | A)"
  ]);

  const dataRows = rows.map((row) =>
    toCsvRow([
      row.factorAId,
      row.factorAName,
      row.factorBId,
      row.factorBName,
      row.coSelectedCount,
      row.coSelectedPercentage.toFixed(1),
      row.conditionalPercentage.toFixed(1)
    ])
  );

  return [header, ...dataRows].join("\n");
}

