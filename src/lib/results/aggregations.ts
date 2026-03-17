import { createSupabaseClient } from "@/lib/supabaseClient";
import {
  computeFactorScore,
  computeResponseTotalPoints,
  computeAverageStrength
} from "./scoring";
import type {
  FactorAggregate,
  ResponseDetailItem,
  ResponseSummary,
  HonorableAggregate
} from "./types";

export async function fetchFinalizedResponseItems() {
  const supabase = createSupabaseClient();

  const { data: items, error: itemsError } = await supabase
    .from("response_items")
    .select(
      `
      id,
      stack_position,
      strength_value,
      factor_id,
      responses!inner(id, finalized, created_at)
    `
    )
    .eq("responses.finalized", true)
    .order("created_at", { ascending: true });

  if (itemsError || !items) {
    throw itemsError ?? new Error("Failed to fetch response items");
  }

  return items as any[];
}

export async function fetchHonorableItems() {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("response_honorable_items")
    .select(
      `
      response_id,
      factor_id,
      responses!inner(id, finalized),
      factors!inner(id, name, category, is_active)
    `
    )
    .eq("responses.finalized", true)
    .eq("factors.is_active", true);

  if (error || !data) {
    throw error ?? new Error("Failed to fetch honorable items");
  }

  return data as any[];
}

export async function fetchActiveFactors() {
  const supabase = createSupabaseClient();
  const { data: factors, error } = await supabase
    .from("factors")
    .select("id, name, category, description, is_active")
    .eq("is_active", true);

  if (error || !factors) {
    throw error ?? new Error("Failed to fetch factors");
  }

  return factors as any[];
}

export function computeMedian(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function computeStdDev(values: number[]): number | null {
  if (values.length <= 1) return null;
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

export function buildFactorAggregates(
  items: any[],
  factors: any[]
): FactorAggregate[] {
  const factorById = new Map<string, any>();
  for (const f of factors) {
    factorById.set(f.id as string, f);
  }
  const byFactor: Record<
    string,
    {
      factorId: string;
      factorName: string;
      category: "core" | "secondary" | "blue_sky";
      description?: string | null;
      ranks: number[];
      strengths: number[];
      itemScores: number[];
      selectionCount: number;
      top3Count: number;
      highStrengthCount: number;
    }
  > = {};

  const responsesById = new Map<
    string,
    { id: string; itemCount: number; factorIds: Set<string> }
  >();

  for (const item of items as any[]) {
    const response = item.responses;
    const factorId = item.factor_id as string;
    const factor = factorById.get(factorId);
    if (!factor || !response) continue;

    const stackPosition = item.stack_position as number;
    const strengthValue = item.strength_value as number;
    const itemScore = computeFactorScore(stackPosition, strengthValue);

    if (!byFactor[factorId]) {
      byFactor[factorId] = {
        factorId,
        factorName: factor.name as string,
        category: factor.category as "core" | "secondary" | "blue_sky",
        description: factor.description as string | null,
        ranks: [],
        strengths: [],
        itemScores: [],
        selectionCount: 0,
        top3Count: 0,
        highStrengthCount: 0
      };
    }

    const agg = byFactor[factorId];
    agg.selectionCount += 1;
    agg.ranks.push(stackPosition);
    agg.strengths.push(strengthValue);
    agg.itemScores.push(itemScore);
    if (stackPosition <= 3) agg.top3Count += 1;
    if (strengthValue >= 4) agg.highStrengthCount += 1;

    const responseId = response.id as string;
    const existing = responsesById.get(responseId) ?? {
      id: responseId,
      itemCount: 0,
      factorIds: new Set<string>()
    };
    existing.itemCount += 1;
    existing.factorIds.add(factorId);
    responsesById.set(responseId, existing);
  }

  const totalResponses = responsesById.size || 1;

  return Object.values(byFactor).map((agg) => {
    const selectionPercentage =
      (agg.selectionCount / totalResponses) * 100 || 0;
    const averageRank =
      agg.ranks.length === 0
        ? null
        : agg.ranks.reduce((a, b) => a + b, 0) / agg.ranks.length;
    const averageStrength =
      agg.strengths.length === 0
        ? null
        : agg.strengths.reduce((a, b) => a + b, 0) / agg.strengths.length;
    const totalPoints = agg.itemScores.reduce((a, b) => a + b, 0);
    const averagePoints =
      agg.itemScores.length === 0
        ? 0
        : totalPoints / agg.itemScores.length;

    const consensusLabel = getConsensusLabel(
      agg.selectionCount,
      averageStrength,
      selectionPercentage
    );
    const disagreementLabel = getDisagreementLabel(
      agg.ranks,
      agg.strengths
    );

    return {
      factorId: agg.factorId,
      factorName: agg.factorName,
      category: agg.category,
      description: agg.description ?? null,
      selectionCount: agg.selectionCount,
      selectionPercentage,
      averageRank,
      medianRank: computeMedian(agg.ranks),
      minRank: agg.ranks.length ? Math.min(...agg.ranks) : null,
      maxRank: agg.ranks.length ? Math.max(...agg.ranks) : null,
      rankStdDev: computeStdDev(agg.ranks),
      averageStrength,
      medianStrength: computeMedian(agg.strengths),
      minStrength: agg.strengths.length ? Math.min(...agg.strengths) : null,
      maxStrength: agg.strengths.length ? Math.max(...agg.strengths) : null,
      strengthStdDev: computeStdDev(agg.strengths),
      totalPoints,
      averagePoints,
      top3Count: agg.top3Count,
      highStrengthCount: agg.highStrengthCount,
      consensusLabel,
      disagreementLabel
    };
  });
}

export function buildResponseSummaries(
  items: any[],
  factors: any[]
): ResponseSummary[] {
  const byResponse: Record<
    string,
    {
      id: string;
      createdAt: string;
      detailItems: ResponseDetailItem[];
    }
  > = {};

  const factorById = new Map<string, any>();
  for (const f of factors) {
    factorById.set(f.id as string, f);
  }

  for (const item of items as any[]) {
    const response = item.responses;
    const responseId = response.id as string;
    const factorId = item.factor_id as string;
    const stackPosition = item.stack_position as number;
    const strengthValue = item.strength_value as number;
    const factor = factorById.get(factorId);

    if (!factor) continue;

    const detailItem: ResponseDetailItem = {
      factorId,
      factorName: factor.name as string,
      category: factor.category as "core" | "secondary" | "blue_sky",
      stackPosition,
      strengthValue,
      itemScore: computeFactorScore(stackPosition, strengthValue)
    };

    if (!byResponse[responseId]) {
      byResponse[responseId] = {
        id: responseId,
        createdAt: response.created_at as string,
        detailItems: []
      };
    }

    byResponse[responseId].detailItems.push(detailItem);
  }

  return Object.values(byResponse).map((r) => {
    const totalPoints = computeResponseTotalPoints(r.detailItems);
    const avgStrength = computeAverageStrength(r.detailItems);
    const sortedByScore = [...r.detailItems].sort(
      (a, b) => b.itemScore - a.itemScore
    );
    const topFactor = sortedByScore[0]?.factorName ?? null;
    const topThreeFactors = sortedByScore
      .slice(0, 3)
      .map((item) => item.factorName);

    return {
      responseId: r.id,
      submittedAt: r.createdAt,
      factorCount: r.detailItems.length,
      topFactor,
      topThreeFactors,
      averageStrength: avgStrength || null,
      totalPointsUsed: totalPoints,
      rigidityScore: null
    };
  });
}

export function buildHonorableAggregates(
  honorableItems: any[],
  factors: any[]
): HonorableAggregate[] {
  const factorById = new Map<string, any>();
  for (const f of factors) {
    factorById.set(f.id as string, f);
  }

  const countsByFactorId = new Map<string, number>();
  const responsesById = new Map<string, true>();

  for (const row of honorableItems as any[]) {
    const factorId = row.factor_id as string;
    const response = row.responses;
    const factor = factorById.get(factorId);
    if (!factor || !response) continue;

    countsByFactorId.set(
      factorId,
      (countsByFactorId.get(factorId) ?? 0) + 1
    );
    responsesById.set(response.id as string, true);
  }

  const totalResponses = responsesById.size || 1;

  const aggregates: HonorableAggregate[] = [];
  for (const [factorId, count] of countsByFactorId.entries()) {
    const factor = factorById.get(factorId);
    if (!factor) continue;
    aggregates.push({
      factorId,
      factorName: factor.name as string,
      category: factor.category as "core" | "secondary" | "blue_sky",
      honorableCount: count,
      honorableSelectionPercentage: (count / totalResponses) * 100
    });
  }

  return aggregates;
}

export function buildOverviewMetrics(
  factorAggregates: FactorAggregate[],
  responseSummaries: ResponseSummary[]
) {
  const totalFinalizedStacks = responseSummaries.length;
  const totalUniqueFactorsSelected = factorAggregates.length;
  const averageFactorsPerStack =
    totalFinalizedStacks === 0
      ? 0
      : responseSummaries.reduce((sum, r) => sum + r.factorCount, 0) /
        totalFinalizedStacks;
  const averagePointsUsed =
    totalFinalizedStacks === 0
      ? 0
      : responseSummaries.reduce((sum, r) => sum + r.totalPointsUsed, 0) /
        totalFinalizedStacks;
  const maxPointsUsed = responseSummaries.reduce(
    (max, r) => Math.max(max, r.totalPointsUsed),
    0
  );
  const minPointsUsed =
    responseSummaries.length === 0
      ? 0
      : responseSummaries.reduce(
          (min, r) => Math.min(min, r.totalPointsUsed),
          Number.POSITIVE_INFINITY
        );

  const bySelection = [...factorAggregates].sort(
    (a, b) => b.selectionCount - a.selectionCount
  );
  const byRank = [...factorAggregates].filter(
    (f) => f.averageRank != null
  ).sort((a, b) => (a.averageRank ?? 0) - (b.averageRank ?? 0));
  const byStrength = [...factorAggregates].filter(
    (f) => f.averageStrength != null
  ).sort((a, b) => (b.averageStrength ?? 0) - (a.averageStrength ?? 0));
  const byAvgPoints = [...factorAggregates].sort(
    (a, b) => b.averagePoints - a.averagePoints
  );
  const byTotalPoints = [...factorAggregates].sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  return {
    totalFinalizedStacks,
    totalUniqueFactorsSelected,
    averageFactorsPerStack,
    averagePointsUsed,
    maxPointsUsed,
    minPointsUsed: minPointsUsed === Number.POSITIVE_INFINITY ? 0 : minPointsUsed,
    topSelected: bySelection[0] ?? null,
    topRanked: byRank[0] ?? null,
    topStrength: byStrength[0] ?? null,
    topAveragePoints: byAvgPoints[0] ?? null,
    topTotalPoints: byTotalPoints[0] ?? null
  };
}

export function buildFactorDetail(
  factorId: string,
  items: any[],
  factors: any[]
) {
  const factor = factors.find((f) => f.id === factorId);
  if (!factor) return null;

  const detailItems = items.filter((i) => i.factor_id === factorId);
  const ranks = detailItems.map((i) => i.stack_position as number);
  const strengths = detailItems.map((i) => i.strength_value as number);
  const scores = detailItems.map((i) =>
    computeFactorScore(i.stack_position as number, i.strength_value as number)
  );

  return {
    factorId,
    factorName: factor.name as string,
    category: factor.category as "core" | "secondary" | "blue_sky",
    description: (factor.description as string | null) ?? null,
    selectionCount: detailItems.length,
    rankDistribution: ranks,
    strengthDistribution: strengths,
    pointsDistribution: scores
  };
}

function getConsensusLabel(
  selectionCount: number,
  averageStrength: number | null,
  selectionPercentage: number
) {
  if (selectionCount === 0) return "Low support" as const;
  if (averageStrength == null) return "Low support" as const;

  if (selectionPercentage >= 60 && averageStrength >= 4) {
    return "Strong consensus" as const;
  }
  if (selectionPercentage >= 35 && averageStrength >= 3.5) {
    return "Moderate consensus" as const;
  }
  if (selectionPercentage >= 20 && averageStrength >= 3) {
    return "Mixed views" as const;
  }
  if (selectionPercentage < 20 && averageStrength >= 3.5) {
    return "Polarizing" as const;
  }
  return "Low support" as const;
}

function getDisagreementLabel(
  ranks: number[],
  strengths: number[]
) {
  const combined = [...ranks, ...strengths];
  const std = computeStdDev(combined);
  if (std == null) return "Low disagreement" as const;
  if (std >= 2.5) return "High disagreement" as const;
  if (std >= 1.5) return "Moderate disagreement" as const;
  return "Low disagreement" as const;
}

