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
      honorableFactorIds?: string[];
    };

    const supabase = createSupabaseClient();

    // Always create a NEW finalized response record so each submission is counted.
    // Because anonymous_token is unique, we add a suffix when needed.
    let responseId: string | null = null;
    const baseToken = body.anonymousToken || "anonymous";
    const candidateTokens = [baseToken, `${baseToken}-${crypto.randomUUID()}`];
    let tokenUsed: string | null = null;

    let createError: any = null;
    for (const anonymousToken of candidateTokens) {
      const { data: response, error: responseError } = await supabase
        .from("responses")
        .insert({
          anonymous_token: anonymousToken,
          finalized: true
        })
        .select("id")
        .single();

      if (!responseError && response) {
        responseId = response.id as string;
        tokenUsed = anonymousToken;
        createError = null;
        break;
      }

      createError = responseError;
      if (responseError?.code !== "23505") {
        // Not a duplicate token issue, stop retrying.
        break;
      }
    }

    if (!responseId) {
      console.error("Failed to create response", createError);
      return NextResponse.json(
        { error: "Failed to create response", details: createError },
        { status: 500 }
      );
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

    const honorableIds = Array.isArray(body.honorableFactorIds)
      ? body.honorableFactorIds.filter((id) => typeof id === "string")
      : [];

    if (honorableIds.length > 0) {
      const honorablePayload = honorableIds.map((factorId) => ({
        response_id: responseId,
        factor_id: factorId
      }));
      const { error: honorableError } = await supabase
        .from("response_honorable_items")
        .insert(honorablePayload);
      if (honorableError) {
        console.error(
          "Failed to create honorable response items",
          honorableError
        );
        return NextResponse.json(
          {
            error: "Failed to create honorable response items",
            details: honorableError
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, responseId, tokenUsed });
  } catch (error) {
    console.error("Unexpected error in submit-response", error);
    return NextResponse.json(
      { error: "Unexpected error in submit-response" },
      { status: 500 }
    );
  }
}

