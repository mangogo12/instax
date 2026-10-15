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
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Categorias</h1>
      <CategoryList categories={categories ?? []} />
    </div>
  )
}
