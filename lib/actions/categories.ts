"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1).max(80),
})

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .single()

  if (!profile?.restaurant_id) return { error: "Restaurante não encontrado" }

  const parsed = categorySchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { error: "Nome inválido" }

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("restaurant_id", profile.restaurant_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from("categories").insert({
    restaurant_id: profile.restaurant_id,
    name: parsed.data.name,
    sort_order: (last?.sort_order ?? -1) + 1,
  })

  if (error) return { error: error.message }
  revalidatePath("/painel/categorias")
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const parsed = categorySchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { error: "Nome inválido" }

  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/painel/categorias")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { count } = await supabase
    .from("dishes")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id)

  if (count && count > 0) return { error: "Remova os pratos desta categoria antes de excluí-la" }

  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/painel/categorias")
  return { success: true }
}

export async function reorderCategories(ids: string[]) {
  const supabase = await createClient()
  await Promise.all(
    ids.map((id, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", id)
    )
  )
  revalidatePath("/painel/categorias")
}
