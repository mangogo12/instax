"use client"

import { useCart } from "@/components/menu/cart-context"
import { Heart, Plus, Play } from "lucide-react"

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
  cdnHostname: string
  liked: boolean
  hasOrders: boolean
  onLike: (dishId: string) => void
  onClick: () => void
}

export function DishCard({ dish, cdnHostname, liked, hasOrders, onLike, onClick }: DishCardProps) {
  const { addItem, items } = useCart()
  const price = (dish.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const inCart = items.find(i => i.dish_id === dish.id)

  const imgUrl =
    dish.media_type === "video" && dish.bunny_video_id && cdnHostname
      ? `https://${cdnHostname}/${dish.bunny_video_id}/thumbnail.jpg`
      : dish.image_url

  return (
    <div
      className="rounded-2xl overflow-hidden bg-zinc-900 flex flex-col cursor-pointer active:scale-[0.97] transition-transform"
      data-dish-id={dish.id}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-zinc-800">
        {imgUrl ? (
          <img src={imgUrl} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-4xl select-none">🍽️</div>
        )}
        {dish.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="size-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onLike(dish.id) }}
          className="absolute top-2 right-2 size-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart className="size-3.5" fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "white"} strokeWidth={2} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{dish.name}</p>
        {dish.description && (
          <p className="text-zinc-400 text-xs leading-snug line-clamp-2">{dish.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <span className="text-green-400 text-sm font-bold">{price}</span>
            {dish.like_count > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Heart className="size-3 fill-zinc-500 stroke-none" />
                <span className="text-zinc-500 text-[11px]">{dish.like_count}</span>
              </div>
            )}
          </div>
          {hasOrders && (
            <button
              onClick={e => { e.stopPropagation(); addItem({ dish_id: dish.id, name: dish.name, price_cents: dish.price_cents }) }}
              className={`size-8 rounded-full flex items-center justify-center transition-colors ${
                inCart ? "bg-green-500" : "bg-zinc-700 active:bg-zinc-600"
              }`}
            >
              {inCart
                ? <span className="text-white text-xs font-bold">{inCart.quantity}</span>
                : <Plus className="size-4 text-white" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
