"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Clock, Users } from "lucide-react"

type OrderStatus = "received" | "preparing" | "ready" | "delivered"

type OrderItem = {
  id: string
  name_snapshot: string
  unit_price_cents: number
  quantity: number
}

type Order = {
  id: string
  customer_name: string
  table_number: number
  status: OrderStatus
  total_cents: number
  created_at: string
  order_items: OrderItem[]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recebido",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
}

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null,
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  received: "border-yellow-500/30 bg-yellow-500/5",
  preparing: "border-blue-500/30 bg-blue-500/5",
  ready: "border-green-500/30 bg-green-500/5",
  delivered: "border-zinc-500/20 bg-zinc-500/5",
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  received: "bg-yellow-500/20 text-yellow-400",
  preparing: "bg-blue-500/20 text-blue-400",
  ready: "bg-green-500/20 text-green-400",
  delivered: "bg-zinc-500/20 text-zinc-400",
}

interface Props {
  restaurantId: string
  initialOrders: Order[]
}

export function OrdersBoard({ restaurantId, initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const newOrder = payload.new as Order
          const { data: items } = await supabase
            .from("order_items")
            .select("id, name_snapshot, unit_price_cents, quantity")
            .eq("order_id", newOrder.id)

          const fullOrder = { ...newOrder, order_items: items ?? [] }
          setOrders(prev => [fullOrder, ...prev])
          toast.success(`Novo pedido — Mesa ${newOrder.table_number}`)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const updated = payload.new as Order
          setOrders(prev =>
            prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  async function advanceStatus(orderId: string, nextStatus: OrderStatus) {
    setLoading(prev => ({ ...prev, [orderId]: true }))
    const supabase = createClient()
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)

    if (error) toast.error("Erro ao atualizar pedido")
    setLoading(prev => ({ ...prev, [orderId]: false }))
  }

  const activeOrders = orders.filter(o => o.status !== "delivered")
  const delivered = orders.filter(o => o.status === "delivered")

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-sm">
        <Clock className="size-8 mb-3 opacity-30" />
        Nenhum pedido ainda. Os novos pedidos aparecem aqui em tempo real.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active orders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            loading={!!loading[order.id]}
            onAdvance={advanceStatus}
          />
        ))}
      </div>

      {/* Delivered */}
      {delivered.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground select-none">
            Entregues hoje ({delivered.length})
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {delivered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                loading={!!loading[order.id]}
                onAdvance={advanceStatus}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function OrderCard({
  order,
  loading,
  onAdvance,
}: {
  order: Order
  loading: boolean
  onAdvance: (id: string, next: OrderStatus) => void
}) {
  const next = STATUS_NEXT[order.status]
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${STATUS_COLORS[order.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Mesa {order.table_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">{order.customer_name}</p>
        </div>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {elapsed < 1 ? "agora" : `${elapsed} min`}
        </span>
      </div>

      <ul className="space-y-1">
        {order.order_items.map(item => (
          <li key={item.id} className="flex justify-between text-xs">
            <span>{item.quantity}× {item.name_snapshot}</span>
            <span className="text-muted-foreground">
              {(item.unit_price_cents * item.quantity / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-1 border-t border-current/10">
        <span className="text-xs font-semibold">
          {(order.total_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
        {next && (
          <button
            onClick={() => onAdvance(order.id, next)}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background disabled:opacity-50"
          >
            {loading ? "..." : `→ ${STATUS_LABELS[next]}`}
          </button>
        )}
      </div>
    </div>
  )
}
