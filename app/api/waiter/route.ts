import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { restaurant_id, table_number, session_id } = body

  if (!restaurant_id || !table_number || !session_id) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.rpc("rpc_call_waiter", {
    p_restaurant_id: restaurant_id,
    p_table_number: table_number,
    p_session_id: session_id,
  })

  if (error) {
    const msg = error.message
    if (msg.includes("rate_limited")) return NextResponse.json({ error: "rate_limited" }, { status: 429 })
    if (msg.includes("restaurant_not_active")) return NextResponse.json({ error: "Restaurante inativo" }, { status: 400 })
    return NextResponse.json({ error: "Erro ao chamar garçom" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
