import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { seedFactors } from "@/lib/factors";

export async function GET() {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("factors")
      .select("id, name, category, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data) {
      throw error ?? new Error("No data returned from factors");
    }

    return NextResponse.json({
      factors: data.map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category
      }))
    });
  } catch {
    // Fallback: use static seed list when Supabase is not configured or errors.
    return NextResponse.json({
      factors: seedFactors.map((f, index) => ({
        id: String(index),
        name: f.name,
        category: f.category
      }))
    });
  }
}

