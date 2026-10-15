export const instant = false

import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Feed } from "@/components/menu/feed"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CardapioPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, status, tables_count")
    .eq("slug", slug)
    .single()

  if (!restaurant) notFound()

  if (restaurant.status !== "active") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold text-white">{restaurant.name}</h1>
          <p className="text-white/50 mt-2">Cardápio temporariamente indisponível.</p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()

  const [dishesRes, likesRes, categoriesRes, planRes] = await Promise.all([
    supabase
      .from("dishes")
      .select("id, name, description, ingredients, serves, prep_time_min, price_cents, media_type, image_url, bunny_video_id, category_id")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order"),
    admin
      .from("likes")
      .select("dish_id")
      .eq("restaurant_id", restaurant.id),
    supabase
      .from("categories")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    admin
      .from("restaurants")
      .select("plan_id, plans!plan_id(has_orders)")
      .eq("id", restaurant.id)
      .single(),
  ])

  const likeMap: Record<string, number> = {}
  for (const l of likesRes.data ?? []) {
    likeMap[l.dish_id] = (likeMap[l.dish_id] ?? 0) + 1
  }

  const dishes = (dishesRes.data ?? []).map(d => ({
    ...d,
    like_count: likeMap[d.id] ?? 0,
  }))

  const planData = planRes.data as any
  const hasOrders = planData?.plans?.has_orders === true
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME ?? ""

  return (
    <Feed
      dishes={dishes}
      categories={categoriesRes.data ?? []}
      restaurantId={restaurant.id}
      cdnHostname={cdnHostname}
      hasOrders={hasOrders}
      tableCount={restaurant.tables_count}
    />
  )
}
