import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { computeFactorScore } from "@/lib/results/scoring";
import { filterResponseSummaries } from "@/lib/results/filters";
import type { ResultsFilters } from "@/lib/results/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const supabase = createSupabaseClient();

    const { data: responseRows, error: responseError } = await supabase
      .from("responses")
      .select("id, created_at")
      .eq("finalized", true)
      .order("created_at", { ascending: false });

    if (responseError || !responseRows) {
      throw responseError ?? new Error("Failed to load finalized responses");
    }

    if (responseRows.length === 0) {
      return NextResponse.json({ responses: [] });
    }

    const responseIds = responseRows.map((r) => r.id as string);
    const { data: itemRows, error: itemsError } = await supabase
      .from("response_items")
      .select("response_id, factor_id, stack_position, strength_value")
      .in("response_id", responseIds);

    if (itemsError || !itemRows) {
      const minimalRows = responseRows.map((r) => ({
        responseId: r.id as string,
        submittedAt: r.created_at as string,
        factorCount: 0,
        topFactor: null,
        topThreeFactors: [],
        averageStrength: null,
        totalPointsUsed: 0,
        rigidityScore: null
      }));
      return NextResponse.json({
        responses: filterResponseSummaries(minimalRows, filters),
        warning:
          "Response items could not be loaded, showing minimal finalized stack records."
      });
    }

    let factorNameById = new Map<string, string>();
    const { data: factorRows, error: factorsError } = await supabase
      .from("factors")
      .select("id, name")
      .eq("is_active", true);
    if (!factorsError && factorRows) {
      factorNameById = new Map(
        factorRows.map((f) => [f.id as string, f.name as string])
      );
    }

    const itemsByResponseId = new Map<string, any[]>();
    for (const item of itemRows as any[]) {
      const list = itemsByResponseId.get(item.response_id as string) ?? [];
      list.push(item);
      itemsByResponseId.set(item.response_id as string, list);
    }

    const summaries = responseRows.map((r) => {
      const rid = r.id as string;
      const items = itemsByResponseId.get(rid) ?? [];

      const totalPointsUsed = items.reduce(
        (sum, item) =>
          sum +
          computeFactorScore(
            item.stack_position as number,
            item.strength_value as number
          ),
        0
      );
      const averageStrength =
        items.length > 0
          ? items.reduce(
              (sum, item) => sum + (item.strength_value as number),
              0
            ) / items.length
          : null;

      const topByScore = [...items]
        .sort(
          (a, b) =>
            computeFactorScore(
              b.stack_position as number,
              b.strength_value as number
            ) -
            computeFactorScore(
              a.stack_position as number,
              a.strength_value as number
            )
        )
        .map((item) => {
          const fid = item.factor_id as string;
          return factorNameById.get(fid) ?? fid;
        });

      return {
        responseId: rid,
        submittedAt: r.created_at as string,
        factorCount: items.length,
        topFactor: topByScore[0] ?? null,
        topThreeFactors: topByScore.slice(0, 3),
        averageStrength,
        totalPointsUsed,
        rigidityScore: null
      };
    });

    return NextResponse.json({
      responses: filterResponseSummaries(summaries, filters),
      warning:
        factorsError != null
          ? "Factor names could not be loaded for all items; IDs are shown where needed."
          : undefined
    });
  } catch (error) {
    console.error("Error in /api/results/responses", error);
    return NextResponse.json(
      {
        responses: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to load response summaries"
      },
      { status: 500 }
    );
  }
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

