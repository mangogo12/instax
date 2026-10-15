"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { DishCard } from "@/components/menu/dish-card"

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
}

function getOrCreateSessionId(): string {
  try {
    const key = "instax_sid"
    let sid = sessionStorage.getItem(key)
    if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem(key, sid) }
    return sid
  } catch { return crypto.randomUUID() }
}

export function Feed({ dishes, categories, restaurantId, cdnHostname }: FeedProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [likes, setLikes] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(dishes.map(d => [d.id, d.like_count]))
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const sessionId = useRef(getOrCreateSessionId())
  const pendingEvents = useRef<any[]>([])

  const filtered = selectedCategory
    ? dishes.filter(d => d.category_id === selectedCategory)
    : dishes

  // Load persisted likes
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("instax_likes") ?? "[]")
      setLikes(new Set(stored))
    } catch {}
  }, [])

  // IntersectionObserver to track active card
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            const idx = cardRefs.current.findIndex(r => r === entry.target)
            if (idx !== -1) setActiveIndex(idx)
          }
        }
      },
      { threshold: 0.7 }
    )
    cardRefs.current.forEach(ref => { if (ref) observer.observe(ref) })
    return () => observer.disconnect()
  }, [filtered])

  // Track view event when active dish changes
  useEffect(() => {
    const dish = filtered[activeIndex]
    if (!dish) return
    pendingEvents.current.push({
      restaurant_id: restaurantId,
      dish_id: dish.id,
      session_id: sessionId.current,
      type: "view",
    })
  }, [activeIndex, restaurantId])

  // Flush events on page hide via sendBeacon
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

  if (filtered.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black text-white/50 text-sm">
        Nenhum prato disponível nesta categoria.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="fixed top-4 left-0 right-0 z-20 flex gap-2 px-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedCategory ? "bg-white text-black" : "bg-white/20 text-white backdrop-blur-sm"
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat.id ? "bg-white text-black" : "bg-white/20 text-white backdrop-blur-sm"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      <div
        ref={containerRef}
        className="h-dvh overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {filtered.map((dish, i) => (
          <div
            key={dish.id}
            ref={el => { cardRefs.current[i] = el }}
          >
            <DishCard
              dish={{ ...dish, like_count: likeCounts[dish.id] ?? dish.like_count }}
              active={activeIndex === i}
              preloadNext={activeIndex === i - 1}
              sessionId={sessionId.current}
              cdnHostname={cdnHostname}
              liked={likes.has(dish.id)}
              onLike={handleLike}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
