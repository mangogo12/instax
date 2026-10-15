"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type CartItem = {
  dish_id: string
  name: string
  price_cents: number
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (dish_id: string) => void
  incrementItem: (dish_id: string) => void
  decrementItem: (dish_id: string) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.dish_id === item.dish_id)
      if (existing) {
        return prev.map(i => i.dish_id === item.dish_id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((dish_id: string) => {
    setItems(prev => prev.filter(i => i.dish_id !== dish_id))
  }, [])

  const incrementItem = useCallback((dish_id: string) => {
    setItems(prev => prev.map(i => i.dish_id === dish_id ? { ...i, quantity: i.quantity + 1 } : i))
  }, [])

  const decrementItem = useCallback((dish_id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.dish_id === dish_id)
      if (!item) return prev
      if (item.quantity <= 1) return prev.filter(i => i.dish_id !== dish_id)
      return prev.map(i => i.dish_id === dish_id ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, incrementItem, decrementItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
