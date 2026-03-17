import type {
  FactorAggregate,
  ResponseSummary,
  ResultsFilters
} from "./types";

export function filterFactorAggregates(
  aggregates: FactorAggregate[],
  filters: ResultsFilters
): FactorAggregate[] {
  return aggregates.filter((f) => {
    if (filters.category && filters.category !== "all") {
      if (f.category !== filters.category) return false;
    }
    if (filters.minSelections && f.selectionCount < filters.minSelections) {
      return false;
    }
    if (filters.consensus && filters.consensus !== "all") {
      if (f.consensusLabel !== filters.consensus) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!f.factorName.toLowerCase().includes(q)) return false;
    }
    if (filters.minStrength && (f.averageStrength ?? 0) < filters.minStrength) {
      return false;
    }
    if (filters.minPoints && f.averagePoints < filters.minPoints) {
      return false;
    }
    if (filters.maxPoints && f.averagePoints > filters.maxPoints) {
      return false;
    }
    return true;
  });
}

export function sortFactorAggregates(
  aggregates: FactorAggregate[],
  sortKey: NonNullable<ResultsFilters["sortKey"]>,
  sortDirection: NonNullable<ResultsFilters["sortDirection"]>
): FactorAggregate[] {
  const dir = sortDirection === "asc" ? 1 : -1;
  return [...aggregates].sort((a, b) => {
    const av = getSortValue(a, sortKey);
    const bv = getSortValue(b, sortKey);
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
  });
}

function getSortValue(
  f: FactorAggregate,
  sortKey: NonNullable<ResultsFilters["sortKey"]>
) {
  switch (sortKey) {
    case "selectionCount":
      return f.selectionCount;
    case "selectionPercentage":
      return f.selectionPercentage;
    case "averageRank":
      return f.averageRank ?? Number.POSITIVE_INFINITY;
    case "averageStrength":
      return f.averageStrength ?? 0;
    case "averagePoints":
      return f.averagePoints;
    default:
      return 0;
  }
}

export function filterResponseSummaries(
  responses: ResponseSummary[],
  filters: ResultsFilters
): ResponseSummary[] {
  return responses.filter((r) => {
    if (
      filters.minFactorCount != null &&
      r.factorCount < filters.minFactorCount
    ) {
      return false;
    }
    if (
      filters.maxFactorCount != null &&
      r.factorCount > filters.maxFactorCount
    ) {
      return false;
    }
    if (filters.minPoints && r.totalPointsUsed < filters.minPoints) {
      return false;
    }
    if (filters.maxPoints && r.totalPointsUsed > filters.maxPoints) {
      return false;
    }
    if (filters.dateFrom && r.submittedAt < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && r.submittedAt > filters.dateTo) {
      return false;
    }
    return true;
  });
}

export function summarizeActiveFilters(filters: ResultsFilters): string {
  const parts: string[] = [];

  if (filters.category && filters.category !== "all") {
    parts.push(`${capitalize(filters.category)} factors`);
  } else {
    parts.push("All factor categories");
  }

  if (filters.minSelections && filters.minSelections > 0) {
    parts.push(`at least ${filters.minSelections} selections`);
  }

  if (filters.consensus && filters.consensus !== "all") {
    parts.push(filters.consensus.toLowerCase());
  }

  if (filters.minPoints || filters.maxPoints) {
    const range = [
      filters.minPoints != null ? `≥ ${filters.minPoints} points` : null,
      filters.maxPoints != null ? `≤ ${filters.maxPoints} points` : null
    ]
      .filter(Boolean)
      .join(" and ");
    if (range) parts.push(range);
  }

  if (filters.search) {
    parts.push(`matching “${filters.search}”`);
  }

  if (parts.length === 0) return "Showing all finalized responses.";
  return `Showing factors with ${parts.join(", ")}.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

