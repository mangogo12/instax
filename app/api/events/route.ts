import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const events = await req.json()
    if (!Array.isArray(events) || events.length === 0) return NextResponse.json({ ok: true })

    const supabase = createAdminClient()
    const rows = events
      .filter(e => e.dish_id && e.session_id && e.restaurant_id && e.type)
      .slice(0, 100)
      .map(e => ({
        dish_id: e.dish_id,
        session_id: e.session_id,
        restaurant_id: e.restaurant_id,
        type: e.type,
        duration_ms: e.duration_ms ?? null,
        completed: e.completed ?? null,
      }))

    if (rows.length > 0) {
      await supabase.from("events").insert(rows as any)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
