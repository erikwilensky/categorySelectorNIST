import { NextResponse } from "next/server";
import {
  buildFactorAggregates,
  fetchActiveFactors,
  fetchFinalizedResponseItems
} from "@/lib/results/aggregations";
import { filterFactorAggregates, sortFactorAggregates } from "@/lib/results/filters";
import type { ResultsFilters } from "@/lib/results/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const filters: ResultsFilters = {
      minSelections: parseNumber(searchParams.get("minSelections")),
      category: (searchParams.get("category") as any) ?? "all",
      consensus:
        (searchParams.get("consensus") as ResultsFilters["consensus"]) ?? "all",
      search: searchParams.get("search") ?? undefined,
      sortKey:
        (searchParams.get("sortKey") as ResultsFilters["sortKey"]) ??
        "selectionCount",
      sortDirection:
        (searchParams.get("sortDirection") as ResultsFilters["sortDirection"]) ??
        "desc"
    };

    const [items, factors] = await Promise.all([
      fetchFinalizedResponseItems(),
      fetchActiveFactors()
    ]);

    const aggregates = buildFactorAggregates(items, factors);
    const filtered = filterFactorAggregates(aggregates, filters);
    const sorted = sortFactorAggregates(
      filtered,
      (filters.sortKey ?? "selectionCount") as NonNullable<
        ResultsFilters["sortKey"]
      >,
      (filters.sortDirection ?? "desc") as NonNullable<
        ResultsFilters["sortDirection"]
      >
    );

    return NextResponse.json({ factors: sorted });
  } catch (error) {
    console.error("Error in /api/results/factors", error);
    return NextResponse.json(
      { factors: [], error: "Failed to load factor aggregates" },
      { status: 500 }
    );
  }
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

