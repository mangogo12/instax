import { createClient } from "@/lib/supabase/server"
import { DishForm } from "@/components/painel/dish-form"
import { notFound } from "next/navigation"

export const instant = false

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
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Editar prato</h1>
        <p className="text-zinc-500 text-sm mt-1">Atualize as informações do prato</p>
      </div>
      <DishForm categories={categories ?? []} restaurantId={restaurantId} dish={dish} />
    </div>
  )
}
