import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { restaurant_id, customer_name, table_number, items } = body

  if (!restaurant_id || !customer_name || !table_number || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin.rpc("rpc_create_order", {
    p_restaurant_id: restaurant_id,
    p_customer_name: customer_name,
    p_table_number: table_number,
    p_items: JSON.stringify(items),
  })

  if (error) {
    const msg = error.message
    if (msg.includes("restaurant_not_active")) return NextResponse.json({ error: "Restaurante inativo" }, { status: 400 })
    if (msg.includes("plan_no_orders")) return NextResponse.json({ error: "Plano sem pedidos" }, { status: 403 })
    if (msg.includes("invalid_table")) return NextResponse.json({ error: "Mesa inválida" }, { status: 400 })
    if (msg.includes("dish_not_found_or_unavailable")) return NextResponse.json({ error: "Prato indisponível" }, { status: 400 })
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }

  return NextResponse.json({ order_id: data })
}
