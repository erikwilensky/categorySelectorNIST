import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient();

    // First delete all response_items (they depend on responses).
    const { error: itemsError } = await supabase
      .from("response_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (itemsError) {
      console.error("Failed to clear response_items", itemsError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to clear response_items",
          details: itemsError.message
        },
        { status: 500 }
      );
    }

    const { error: responsesError } = await supabase
      .from("responses")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (responsesError) {
      console.error("Failed to clear responses", responsesError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to clear responses",
          details: responsesError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error in clear-responses", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error in clear-responses"
      },
      { status: 500 }
    );
  }
}

