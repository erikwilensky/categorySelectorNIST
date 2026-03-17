import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";

export async function GET() {
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
    return NextResponse.json(
      { error: "Failed to fetch response items" },
      { status: 500 }
    );
  }

  const { data: factors, error: factorsError } = await supabase
    .from("factors")
    .select("id, name, is_active")
    .eq("is_active", true);

  if (factorsError || !factors) {
    return NextResponse.json(
      { error: "Failed to fetch factors" },
      { status: 500 }
    );
  }

  const aggregates = new Map<
    string,
    {
      factorId: string;
      selectionCount: number;
      totalRank: number;
      totalStrength: number;
    }
  >();

  for (const row of items as any[]) {
    const id = row.factor_id as string;
    const existing = aggregates.get(id) ?? {
      factorId: id,
      selectionCount: 0,
      totalRank: 0,
      totalStrength: 0
    };
    existing.selectionCount += 1;
    existing.totalRank += row.stack_position as number;
    existing.totalStrength += row.strength_value as number;
    aggregates.set(id, existing);
  }

  const factorNameById = new Map<string, string>();
  for (const f of factors as any[]) {
    factorNameById.set(f.id as string, f.name as string);
  }

  const payload = Array.from(aggregates.values()).map((a) => {
    const averageRank = a.totalRank / a.selectionCount;
    const averageStrength = a.totalStrength / a.selectionCount;

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
      consensus
    };
  });

  return NextResponse.json({ factors: payload });
}

