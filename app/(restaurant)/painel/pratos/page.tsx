import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DishList } from "@/components/painel/dish-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function PratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user!.id)
    .single()

  const restaurantId = profile!.restaurant_id!

  const [{ data: dishes }, { data: categories }] = await Promise.all([
    supabase.from("dishes").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
    supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId).order("sort_order"),
  ])

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Pratos</h1>
        <Link href="/painel/pratos/nova">
          <Button size="sm"><Plus className="size-4 mr-1" />Novo prato</Button>
        </Link>
      </div>
      <DishList dishes={dishes ?? []} categories={categories ?? []} />
    </div>
  )
}
