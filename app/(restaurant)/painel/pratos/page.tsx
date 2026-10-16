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
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Pratos</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie os itens do seu cardápio</p>
        </div>
        <Link href="/painel/pratos/nova">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl px-4">
            <Plus className="size-4 mr-1.5" />Novo prato
          </Button>
        </Link>
      </div>
      <DishList dishes={dishes ?? []} categories={categories ?? []} />
    </div>
  )
}
