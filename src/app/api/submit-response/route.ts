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

    // Either create a new response or reuse an existing one for this anonymous token.
    const { data: existing, error: existingError } = await supabase
      .from("responses")
      .select("id")
      .eq("anonymous_token", body.anonymousToken)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Failed to look up existing response", existingError);
      return NextResponse.json(
        { error: "Failed to look up existing response", details: existingError },
        { status: 500 }
      );
    }

    let responseId: string;

    if (existing && existing.id) {
      responseId = existing.id as string;
      const { error: updateError } = await supabase
        .from("responses")
        .update({ finalized: true, updated_at: new Date().toISOString() })
        .eq("id", responseId);
      if (updateError) {
        console.error("Failed to update existing response", updateError);
        return NextResponse.json(
          { error: "Failed to update existing response", details: updateError },
          { status: 500 }
        );
      }
      const { error: deleteItemsError } = await supabase
        .from("response_items")
        .delete()
        .eq("response_id", responseId);
      if (deleteItemsError) {
        console.error("Failed to clear existing response items", deleteItemsError);
        return NextResponse.json(
          {
            error: "Failed to clear existing response items",
            details: deleteItemsError
          },
          { status: 500 }
        );
      }
    } else {
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
      responseId = response.id as string;
    }

    const itemsPayload = body.items.map((item) => ({
      response_id: responseId,
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

