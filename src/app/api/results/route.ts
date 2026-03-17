import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { seedFactors } from "@/lib/factors";

export async function GET() {
  try {
    const supabase = createSupabaseClient();

    const { data: items, error: itemsError } = await supabase
      .from("response_items")
      .select(
        `
        factor_id,
        stack_position,
        strength_value,
        responses!inner(finalized)
      `
      )
      .eq("responses.finalized", true);

    if (itemsError || !items) {
      throw itemsError ?? new Error("Failed to fetch response items");
    }

    const { data: factors, error: factorsError } = await supabase
      .from("factors")
      .select("id, name, is_active")
      .eq("is_active", true);

    if (factorsError || !factors) {
      throw factorsError ?? new Error("Failed to fetch factors");
    }

    const aggregates = new Map<
      string,
      {
        factorId: string;
        selectionCount: number;
        totalRank: number;
        totalStrength: number;
        totalScore: number;
      }
    >();

    for (const row of items as any[]) {
      const id = row.factor_id as string;
      const existing = aggregates.get(id) ?? {
        factorId: id,
        selectionCount: 0,
        totalRank: 0,
        totalStrength: 0,
        totalScore: 0
      };
      existing.selectionCount += 1;
      const positionIndex = row.stack_position as number;
      const strength = row.strength_value as number;
      existing.totalRank += positionIndex;
      existing.totalStrength += strength;
      const positionWeight = Math.max(1, 8 - positionIndex);
      const strengthWeights = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 } as const;
      const strengthWeight = strengthWeights[strength as 1 | 2 | 3 | 4 | 5] ?? 0;
      existing.totalScore += 3 * positionWeight * strengthWeight;
      aggregates.set(id, existing);
    }

    const factorNameById = new Map<string, string>();
    for (const f of factors as any[]) {
      factorNameById.set(f.id as string, f.name as string);
    }

    const payload = Array.from(aggregates.values()).map((a) => {
      const averageRank = a.totalRank / a.selectionCount;
      const averageStrength = a.totalStrength / a.selectionCount;
      const averageScore = a.totalScore / a.selectionCount;

      let consensus: "high" | "mixed" | "low" = "low";
      if (a.selectionCount >= 10 && averageStrength >= 3.5) {
        consensus = "high";
      } else if (a.selectionCount >= 3) {
        consensus = "mixed";
      }

      return {
        factorId: a.factorId,
        factorName: factorNameById.get(a.factorId) ?? a.factorId,
        selectionCount: a.selectionCount,
        averageRank,
        averageStrength,
        averageScore,
        consensus
      };
    });

    return NextResponse.json({ factors: payload });
  } catch {
    // Fallback when Supabase is not configured or errors: return empty results
    // so the UI can still render.
    return NextResponse.json({
      factors: seedFactors.map((f, index) => ({
        factorId: String(index),
        factorName: f.name,
        selectionCount: 0,
        averageRank: null,
        averageStrength: null,
        averageScore: null,
        consensus: "low" as const
      }))
    });
  }
}

