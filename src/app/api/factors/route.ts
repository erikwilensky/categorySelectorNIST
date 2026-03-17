import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";

export async function GET() {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("factors")
    .select("id, name, category, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to load factors from Supabase" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    factors: data.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category
    }))
  });
}

