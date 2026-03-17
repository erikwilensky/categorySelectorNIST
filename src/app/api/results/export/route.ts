import { NextResponse } from "next/server";
import {
  buildCooccurrenceMatrix
} from "@/lib/results/cooccurrence";
import {
  buildFactorAggregates,
  buildResponseSummaries,
  fetchActiveFactors,
  fetchFinalizedResponseItems
} from "@/lib/results/aggregations";
import {
  exportCooccurrenceCSV,
  exportFactorSummaryCSV,
  exportResponseSummaryCSV
} from "@/lib/results/exports";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "factor-summary-csv";

    const [items, factors] = await Promise.all([
      fetchFinalizedResponseItems(),
      fetchActiveFactors()
    ]);

    const factorAggregates = buildFactorAggregates(items, factors);
    const responseSummaries = buildResponseSummaries(items, factors);

    let filename = "export.csv";
    let csv = "";

    if (type === "factor-summary-csv") {
      filename = "factor-summary.csv";
      csv = exportFactorSummaryCSV(factorAggregates);
    } else if (type === "response-summary-csv") {
      filename = "response-summary.csv";
      csv = exportResponseSummaryCSV(responseSummaries);
    } else if (type === "cooccurrence-csv") {
      const simpleItems = items.map((i: any) => ({
        response_id: i.responses.id as string,
        factor_id: i.factor_id as string
      }));
      const matrix = buildCooccurrenceMatrix(simpleItems, factors);
      filename = "cooccurrence.csv";
      csv = exportCooccurrenceCSV(matrix);
    } else {
      return NextResponse.json(
        { error: "Unsupported export type" },
        { status: 400 }
      );
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Error in /api/results/export", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}

