import { createClient } from "@/lib/supabase/server"
import { DishForm } from "@/components/painel/dish-form"

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
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Novo prato</h1>
      <DishForm categories={categories ?? []} restaurantId={restaurantId} />
    </div>
  )
}
