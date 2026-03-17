import { NextResponse } from "next/server";
import {
  buildFactorAggregates,
  buildOverviewMetrics,
  buildResponseSummaries,
  fetchActiveFactors,
  fetchFinalizedResponseItems
} from "@/lib/results/aggregations";

export async function GET() {
  try {
    const [items, factors] = await Promise.all([
      fetchFinalizedResponseItems(),
      fetchActiveFactors()
    ]);

    const factorAggregates = buildFactorAggregates(items, factors);
    const responseSummaries = buildResponseSummaries(items, factors);
    const overview = buildOverviewMetrics(factorAggregates, responseSummaries);

    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Error in /api/results/overview", error);
    return NextResponse.json(
      { overview: null, error: "Failed to load overview metrics" },
      { status: 500 }
    );
  }
}

