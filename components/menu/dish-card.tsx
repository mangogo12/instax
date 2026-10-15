"use client"

import { useState, useCallback } from "react"
import { VideoPlayer } from "@/components/menu/video-player"
import { useCart } from "@/components/menu/cart-context"
import { Heart, ChevronUp, ChevronDown, Clock, Users, ShoppingCart, Plus } from "lucide-react"

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
}

interface DishCardProps {
  dish: Dish
  active: boolean
  preloadNext: boolean
  sessionId: string
  cdnHostname: string
  liked: boolean
  hasOrders: boolean
  onLike: (dishId: string) => void
}

export function DishCard({ dish, active, preloadNext, sessionId, cdnHostname, liked, hasOrders, onLike }: DishCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { addItem, items } = useCart()
  const price = (dish.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const inCart = items.find(i => i.dish_id === dish.id)

  return (
    <div className="relative w-full h-dvh snap-start overflow-hidden bg-black">
      {/* Media */}
      {dish.media_type === "video" && dish.bunny_video_id ? (
        <VideoPlayer
          videoId={dish.bunny_video_id}
          cdnHostname={cdnHostname}
          active={active}
          preload={preloadNext}
        />
      ) : dish.image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${dish.image_url})`,
            animation: active ? "kenBurns 10s ease-in-out infinite alternate" : "none",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Right actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        <button
          onClick={() => onLike(dish.id)}
          className="flex flex-col items-center gap-1"
        >
          <Heart
            className="size-7 drop-shadow"
            fill={liked ? "#ef4444" : "none"}
            stroke={liked ? "#ef4444" : "white"}
          />
          <span className="text-white text-xs font-medium drop-shadow">{dish.like_count}</span>
        </button>

        {hasOrders && (
          <button
            onClick={() => addItem({ dish_id: dish.id, name: dish.name, price_cents: dish.price_cents })}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative">
              <ShoppingCart
                className="size-7 drop-shadow"
                stroke={inCart ? "#22c55e" : "white"}
              />
              {inCart && (
                <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-green-500 text-[10px] text-white font-bold flex items-center justify-center leading-none">
                  {inCart.quantity}
                </span>
              )}
            </div>
            <span className="text-white text-xs font-medium drop-shadow">
              {inCart ? "No carrinho" : "Pedir"}
            </span>
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className={`absolute bottom-0 left-0 right-0 p-5 ${hasOrders ? "pb-20" : ""}`}>
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-xl font-bold leading-tight drop-shadow">{dish.name}</h2>
            <p className="text-white/80 text-lg font-semibold mt-0.5 drop-shadow">{price}</p>

            <div className="flex gap-3 mt-1.5">
              {dish.serves && (
                <span className="flex items-center gap-1 text-white/70 text-xs"><Users className="size-3" />{dish.serves} pessoa{dish.serves > 1 ? "s" : ""}</span>
              )}
              {dish.prep_time_min && (
                <span className="flex items-center gap-1 text-white/70 text-xs"><Clock className="size-3" />{dish.prep_time_min} min</span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable panel */}
        {(dish.description || dish.ingredients) && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-white/70 text-xs"
            >
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
              {expanded ? "Ocultar detalhes" : "Ver detalhes"}
            </button>
            {expanded && (
              <div className="mt-2 rounded-xl bg-black/60 backdrop-blur-sm p-4 text-sm text-white/90 space-y-2">
                {dish.description && <p>{dish.description}</p>}
                {dish.ingredients && (
                  <p className="text-white/70 text-xs"><span className="text-white/50 uppercase tracking-wide text-[10px]">Ingredientes</span><br />{dish.ingredients}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
