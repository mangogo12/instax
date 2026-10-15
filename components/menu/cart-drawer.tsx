"use client"

import { useState } from "react"
import { useCart } from "@/components/menu/cart-context"
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CartDrawerProps {
  restaurantId: string
  tableCount: number
  onClose: () => void
}

export function CartDrawer({ restaurantId, tableCount, onClose }: CartDrawerProps) {
  const { items, incrementItem, decrementItem, removeItem, clearCart, total } = useCart()
  const [name, setName] = useState("")
  const [table, setTable] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error("Informe seu nome"); return }
    const tableNum = parseInt(table)
    if (!tableNum || tableNum < 1 || tableNum > tableCount) {
      toast.error(`Mesa inválida (1–${tableCount})`); return
    }
    if (items.length === 0) { toast.error("Carrinho vazio"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          customer_name: name.trim(),
          table_number: tableNum,
          items: items.map(i => ({ dish_id: i.dish_id, quantity: i.quantity })),
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? "Erro ao enviar pedido")
        return
      }
      toast.success("Pedido enviado! Aguarde.")
      clearCart()
      onClose()
    } catch {
      toast.error("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" />

      {/* Sheet */}
      <div
        className="bg-zinc-900 rounded-t-2xl max-h-[85dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShoppingCart className="size-5" />
            Seu pedido
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
          {items.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">Nenhum item adicionado</p>
          ) : (
            items.map(item => (
              <div key={item.dish_id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-white/60 text-xs">
                    {(item.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decrementItem(item.dish_id)}
                    className="size-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => incrementItem(item.dish_id)}
                    className="size-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                  >
                    <Plus className="size-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.dish_id)}
                    className="size-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-white font-semibold">
            <span>Total</span>
            <span>{(total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>

          <div className="flex gap-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/15"
            />
            <input
              value={table}
              onChange={e => setTable(e.target.value)}
              placeholder={`Mesa (1–${tableCount})`}
              type="number"
              min={1}
              max={tableCount}
              className="w-28 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
          >
            {loading ? "Enviando..." : "Confirmar pedido"}
          </button>
        </form>
      </div>
    </div>
  )
}
