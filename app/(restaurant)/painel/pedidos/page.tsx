import { createClient } from "@/lib/supabase/server"
import { OrdersBoard } from "@/components/painel/orders-board"
import { redirect } from "next/navigation"

export const instant = false

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .single()

  if (!profile?.restaurant_id) {
    return <div className="p-6 text-muted-foreground text-sm">Restaurante não configurado.</div>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_name, table_number, status, total_cents, created_at, order_items(id, name_snapshot, unit_price_cents, quantity)")
    .eq("restaurant_id", profile.restaurant_id)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Atualizações em tempo real</p>
        </div>
      </div>

      <OrdersBoard
        restaurantId={profile.restaurant_id}
        initialOrders={(orders as any) ?? []}
      />
    </div>
  )
}
