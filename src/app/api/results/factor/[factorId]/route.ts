import { NextResponse } from "next/server";
import {
  buildFactorDetail,
  buildResponseSummaries,
  fetchActiveFactors,
  fetchFinalizedResponseItems
} from "@/lib/results/aggregations";
import { buildCooccurrenceMatrix, getTopPairs } from "@/lib/results/cooccurrence";

interface Params {
  params: { factorId: string };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const factorId = params.factorId;
    const [items, factors] = await Promise.all([
      fetchFinalizedResponseItems(),
      fetchActiveFactors()
    ]);

    const detail = buildFactorDetail(factorId, items, factors);
    if (!detail) {
      return NextResponse.json(
        { error: "Factor not found" },
        { status: 404 }
      );
    }

    const simpleItems = items.map((i: any) => ({
      response_id: i.responses.id as string,
      factor_id: i.factor_id as string
    }));
    const matrix = buildCooccurrenceMatrix(simpleItems, factors);
    const topPairs = getTopPairs(
      matrix.filter(
        (row) => row.factorAId === factorId || row.factorBId === factorId
      ),
      10
    );

    const responseSummaries = buildResponseSummaries(items, factors).filter(
      (r) =>
        items.some(
          (i: any) =>
            i.responses.id === r.responseId && i.factor_id === factorId
        )
    );

    return NextResponse.json({
      factor: detail,
      topCooccurring: topPairs,
      responses: responseSummaries
    });
  } catch (error) {
    console.error("Error in /api/results/factor/[factorId]", error);
    return NextResponse.json(
      { error: "Failed to load factor detail" },
      { status: 500 }
    );
  }
}

