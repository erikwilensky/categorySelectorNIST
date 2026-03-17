import { NextResponse } from "next/server";
import { buildCooccurrenceMatrix } from "@/lib/results/cooccurrence";
import { fetchActiveFactors, fetchFinalizedResponseItems } from "@/lib/results/aggregations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const factorId = url.searchParams.get("factorId") ?? undefined;

    const [items, factors] = await Promise.all([
      fetchFinalizedResponseItems(),
      fetchActiveFactors()
    ]);

    const simpleItems = items.map((i: any) => ({
      response_id: i.responses.id as string,
      factor_id: i.factor_id as string
    }));

    const matrix = buildCooccurrenceMatrix(simpleItems, factors);

    const rows = factorId
      ? matrix.filter(
          (row) => row.factorAId === factorId || row.factorBId === factorId
        )
      : matrix;

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Error in /api/results/cooccurrence", error);
    return NextResponse.json(
      { rows: [], error: "Failed to load co-occurrence data" },
      { status: 500 }
    );
  }
}

