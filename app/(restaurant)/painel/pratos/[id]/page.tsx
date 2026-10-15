import { createClient } from "@/lib/supabase/server"
import { DishForm } from "@/components/painel/dish-form"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarPratoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user!.id)
    .single()

  const restaurantId = profile!.restaurant_id!

  const [{ data: dish }, { data: categories }] = await Promise.all([
    supabase.from("dishes").select("*").eq("id", id).eq("restaurant_id", restaurantId).single(),
    supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId).order("sort_order"),
  ])

  if (!dish) notFound()

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Editar prato</h1>
      <DishForm categories={categories ?? []} restaurantId={restaurantId} dish={dish} />
    </div>
  )
}
