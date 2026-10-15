"use client"

import { useEffect, useRef, useState } from "react"
import { DishCard } from "@/components/menu/dish-card"
import { CartProvider, useCart } from "@/components/menu/cart-context"
import { CartDrawer } from "@/components/menu/cart-drawer"
import { ShoppingCart, BellRing, X, Clock, Users, Plus } from "lucide-react"
import { toast } from "sonner"

type Dish = {
  id: string
  name: string
  description: string | null
  ingredients: string | null
  serves: number | null
  prep_time_min: number | null
  price_cents: number
  media_type: "image" | "video"
  image_url: string | null
  bunny_video_id: string | null
  like_count: number
  category_id: string
}

type Category = { id: string; name: string }

interface FeedProps {
  dishes: Dish[]
  categories: Category[]
  restaurantId: string
  cdnHostname: string
  hasOrders: boolean
  tableCount: number
}

function getOrCreateSessionId(): string {
  try {
    const key = "instax_sid"
    let sid = sessionStorage.getItem(key)
    if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem(key, sid) }
    return sid
  } catch { return crypto.randomUUID() }
}

function DishModal({ dish, cdnHostname, liked, hasOrders, onLike, onClose }: {
  dish: Dish; cdnHostname: string; liked: boolean; hasOrders: boolean
  onLike: (id: string) => void; onClose: () => void
}) {
  const { addItem, items } = useCart()
  const inCart = items.find(i => i.dish_id === dish.id)
  const price = (dish.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const imgUrl =
    dish.media_type === "video" && dish.bunny_video_id && cdnHostname
      ? `https://${cdnHostname}/${dish.bunny_video_id}/thumbnail.jpg`
      : dish.image_url

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-zinc-900 rounded-t-3xl overflow-hidden max-h-[90dvh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="relative aspect-[16/9] bg-zinc-800 shrink-0">
          {imgUrl
            ? <img src={imgUrl} alt={dish.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-5xl">🍽️</div>}
          <button onClick={onClose} className="absolute top-3 right-3 size-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <X className="size-4 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          <div>
            <h2 className="text-white text-xl font-bold">{dish.name}</h2>
            <p className="text-green-400 text-lg font-bold mt-0.5">{price}</p>
          </div>

          <div className="flex gap-4">
            {dish.serves && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <Users className="size-4" />{dish.serves} pessoa{dish.serves > 1 ? "s" : ""}
              </div>
            )}
            {dish.prep_time_min && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <Clock className="size-4" />{dish.prep_time_min} min
              </div>
            )}
          </div>

          {dish.description && (
            <div>
              <p className="text-zinc-300 text-sm font-medium mb-1">Descrição</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{dish.description}</p>
            </div>
          )}

          {dish.ingredients && (
            <div>
              <p className="text-zinc-300 text-sm font-medium mb-1">Ingredientes</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{dish.ingredients}</p>
            </div>
          )}
        </div>

        {hasOrders && (
          <div className="px-5 py-4 border-t border-zinc-800 shrink-0">
            <button
              onClick={() => { addItem({ dish_id: dish.id, name: dish.name, price_cents: dish.price_cents }); onClose() }}
              className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-semibold text-base flex items-center justify-center gap-2"
            >
              <Plus className="size-5" />
              {inCart ? `Adicionar mais · ${(dish.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : `Adicionar · ${price}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FeedInner({ dishes, categories, restaurantId, cdnHostname, hasOrders, tableCount }: FeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [likes, setLikes] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(dishes.map(d => [d.id, d.like_count]))
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [callingWaiter, setCallingWaiter] = useState(false)
  const [activeDish, setActiveDish] = useState<Dish | null>(null)
  const sessionId = useRef(getOrCreateSessionId())
  const pendingEvents = useRef<any[]>([])
  const { count } = useCart()

  const filtered = selectedCategory
    ? dishes.filter(d => d.category_id === selectedCategory)
    : dishes

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("instax_likes") ?? "[]")
      setLikes(new Set(stored))
    } catch {}
  }, [])

  useEffect(() => {
    const viewed = new Set<string>()
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.dishId
            if (id && !viewed.has(id)) {
              viewed.add(id)
              pendingEvents.current.push({
                restaurant_id: restaurantId,
                dish_id: id,
                session_id: sessionId.current,
                type: "view",
              })
            }
          }
        }
      },
      { threshold: 0.5 }
    )
    document.querySelectorAll("[data-dish-id]").forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [filtered, restaurantId])

  useEffect(() => {
    function flush() {
      if (pendingEvents.current.length === 0) return
      const payload = JSON.stringify(pendingEvents.current)
      pendingEvents.current = []
      navigator.sendBeacon("/api/events", payload)
    }
    document.addEventListener("visibilitychange", flush)
    return () => document.removeEventListener("visibilitychange", flush)
  }, [])

  async function handleLike(dishId: string) {
    const newLiked = !likes.has(dishId)
    setLikes(prev => {
      const next = new Set(prev)
      newLiked ? next.add(dishId) : next.delete(dishId)
      try { localStorage.setItem("instax_likes", JSON.stringify([...next])) } catch {}
      return next
    })
    setLikeCounts(prev => ({ ...prev, [dishId]: (prev[dishId] ?? 0) + (newLiked ? 1 : -1) }))
    try {
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish_id: dishId, session_id: sessionId.current, restaurant_id: restaurantId }),
      })
    } catch {}
  }

  async function handleCallWaiter() {
    const tableStr = prompt("Qual é o número da sua mesa?")
    const table = parseInt(tableStr ?? "")
    if (!table || table < 1 || table > tableCount) {
      toast.error(`Mesa inválida (1–${tableCount})`)
      return
    }
    setCallingWaiter(true)
    try {
      const res = await fetch("/api/waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, table_number: table, session_id: sessionId.current }),
      })
      if (res.ok) {
        toast.success("Garçom chamado!")
      } else {
        const { error } = await res.json()
        if (error === "rate_limited") toast.error("Aguarde antes de chamar novamente")
        else toast.error("Erro ao chamar garçom")
      }
    } catch {
      toast.error("Erro de conexão")
    } finally {
      setCallingWaiter(false)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      {/* Sticky header with category chips */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !selectedCategory ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={`px-4 pt-4 ${hasOrders ? "pb-28" : "pb-8"}`}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Nenhum prato disponível nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(dish => (
              <DishCard
                key={dish.id}
                dish={{ ...dish, like_count: likeCounts[dish.id] ?? dish.like_count }}
                cdnHostname={cdnHostname}
                liked={likes.has(dish.id)}
                hasOrders={hasOrders}
                onLike={handleLike}
                onClick={() => setActiveDish(dish)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FABs */}
      {hasOrders && (
        <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between">
          <button
            onClick={handleCallWaiter}
            disabled={callingWaiter}
            className="flex items-center gap-2 bg-zinc-800 text-white text-sm font-medium px-4 py-3 rounded-2xl border border-zinc-700 disabled:opacity-50"
          >
            <BellRing className="size-4" />
            Garçom
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg"
          >
            <ShoppingCart className="size-4" />
            Carrinho
            {count > 0 && (
              <span className="absolute -top-2 -right-2 size-5 rounded-full bg-white text-green-600 text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Dish detail modal */}
      {activeDish && (
        <DishModal
          dish={{ ...activeDish, like_count: likeCounts[activeDish.id] ?? activeDish.like_count }}
          cdnHostname={cdnHostname}
          liked={likes.has(activeDish.id)}
          hasOrders={hasOrders}
          onLike={handleLike}
          onClose={() => setActiveDish(null)}
        />
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          restaurantId={restaurantId}
          tableCount={tableCount}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  )
}

export function Feed(props: FeedProps) {
  return (
    <CartProvider>
      <FeedInner {...props} />
    </CartProvider>
  )
}
