import { NextResponse } from "next/server";
import {
  buildResponseSummaries,
  fetchActiveFactors,
  fetchFinalizedResponseItems
} from "@/lib/results/aggregations";
import { filterResponseSummaries } from "@/lib/results/filters";
import type { ResultsFilters } from "@/lib/results/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const filters: ResultsFilters = {
      minFactorCount: parseNumber(searchParams.get("minFactorCount")),
      maxFactorCount: parseNumber(searchParams.get("maxFactorCount")),
      minPoints: parseNumber(searchParams.get("minPoints")),
      maxPoints: parseNumber(searchParams.get("maxPoints")),
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined
    };

    const [items, factors] = await Promise.all([
      fetchFinalizedResponseItems(),
      fetchActiveFactors()
    ]);

    const summaries = buildResponseSummaries(items, factors);
    const filtered = filterResponseSummaries(summaries, filters);

    return NextResponse.json({ responses: filtered });
  } catch (error) {
    console.error("Error in /api/results/responses", error);
    return NextResponse.json(
      { responses: [], error: "Failed to load response summaries" },
      { status: 500 }
    );
  }
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

