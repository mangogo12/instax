import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const { dish_id, session_id, restaurant_id } = await req.json()
    if (!dish_id || !session_id || !restaurant_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const supabase = createAdminClient()
    await supabase.rpc("rpc_toggle_like", { p_dish_id: dish_id, p_session_id: session_id })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
