import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Body = {
  event_name?: string;
  restaurant_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    if (!body?.event_name) {
      return NextResponse.json({ error: "event_name is required" }, { status: 400 });
    }

    await supabase.from("events").insert({
      event_name: body.event_name,
      restaurant_id: body.restaurant_id ?? null,
      metadata: body.metadata ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unexpected error",
      },
      { status: 500 }
    );
  }
}
