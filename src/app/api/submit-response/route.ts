import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      anonymousToken: string;
      items: {
        factorId: string;
        stackPosition: number;
        strengthValue: number;
      }[];
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
      console.error("Failed to create response", responseError);
      return NextResponse.json(
        { error: "Failed to create response", details: responseError },
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
      console.error("Failed to create response items", itemsError);
      return NextResponse.json(
        { error: "Failed to create response items", details: itemsError },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error in submit-response", error);
    return NextResponse.json(
      { error: "Unexpected error in submit-response" },
      { status: 500 }
    );
  }
}

