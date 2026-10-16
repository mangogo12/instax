import { createClient } from "@/lib/supabase/server"
import { CategoryList } from "@/components/painel/category-list"

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user!.id)
    .single()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", profile!.restaurant_id!)
    .order("sort_order")

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Categorias</h1>
        <p className="text-zinc-500 text-sm mt-1">Organize os pratos por categoria</p>
      </div>
      <CategoryList categories={categories ?? []} />
    </div>
  )
}
