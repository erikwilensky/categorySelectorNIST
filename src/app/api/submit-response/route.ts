import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    anonymousToken: string;
    items: { factorId: string; stackPosition: number; strengthValue: number }[];
  };

  const supabase = createSupabaseClient();

  const { data: response, error: responseError } = await supabase
    .from("responses")
    .insert({
      anonymous_token: body.anonymousToken,
      finalized: true
    })
    .select("id")
    .single();

  if (responseError || !response) {
    return NextResponse.json(
      { error: "Failed to create response" },
      { status: 500 }
    );
  }

  const itemsPayload = body.items.map((item) => ({
    response_id: response.id,
    factor_id: item.factorId,
    stack_position: item.stackPosition,
    strength_value: item.strengthValue
  }));

  const { error: itemsError } = await supabase
    .from("response_items")
    .insert(itemsPayload);

  if (itemsError) {
    return NextResponse.json(
      { error: "Failed to create response items" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

