import { createClient } from "@/lib/supabase/server"
import { DishForm } from "@/components/painel/dish-form"

export const instant = false

export default async function NovoPratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user!.id)
    .single()

  const restaurantId = profile!.restaurant_id!

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("restaurant_id", restaurantId)
    .order("sort_order")

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Novo prato</h1>
        <p className="text-zinc-500 text-sm mt-1">Adicione um item ao seu cardápio</p>
      </div>
      <DishForm categories={categories ?? []} restaurantId={restaurantId} />
    </div>
  )
}
