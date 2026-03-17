import { NextResponse } from "next/server";
import {
  buildHonorableAggregates,
  fetchActiveFactors,
  fetchHonorableItems
} from "@/lib/results/aggregations";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const category = searchParams.get("category") as
      | "core"
      | "secondary"
      | "blue_sky"
      | "all"
      | null;
    const minHonorableCountRaw = searchParams.get("minHonorableCount");
    const minHonorableCount = minHonorableCountRaw
      ? Number(minHonorableCountRaw)
      : 0;
    const search = searchParams.get("search") ?? "";

    const [items, factors] = await Promise.all([
      fetchHonorableItems(),
      fetchActiveFactors()
    ]);

    const aggregates = buildHonorableAggregates(items, factors).filter((f) => {
      if (category && category !== "all" && f.category !== category) {
        return false;
      }
      if (minHonorableCount && f.honorableCount < minHonorableCount) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!f.factorName.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return NextResponse.json({ factors: aggregates });
  } catch (error) {
    console.error("Error in /api/results/honorable", error);
    return NextResponse.json(
      { factors: [], error: "Failed to load honorable mention aggregates" },
      { status: 500 }
    );
  }
}

