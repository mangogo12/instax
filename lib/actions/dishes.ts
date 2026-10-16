"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const dishSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  ingredients: z.string().max(500).optional(),
  serves: z.coerce.number().int().min(1).max(100).optional(),
  prep_time_min: z.coerce.number().int().min(1).max(300).optional(),
  price_cents: z.coerce.number().int().min(1),
  category_id: z.string().uuid(),
  media_type: z.enum(["image", "video"]),
  image_url: z.string().url().optional().or(z.literal("")),
  bunny_video_id: z.string().optional().or(z.literal("")),
  is_available: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
})

export async function createDish(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .single()

  if (!profile?.restaurant_id) return { error: "Restaurante não encontrado" }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    serves: formData.get("serves") || undefined,
    prep_time_min: formData.get("prep_time_min") || undefined,
    price_cents: formData.get("price_cents"),
    category_id: formData.get("category_id"),
    media_type: formData.get("media_type"),
    image_url: formData.get("image_url") || undefined,
    bunny_video_id: formData.get("bunny_video_id") || undefined,
    is_available: formData.get("is_available") === "true",
    is_featured: formData.get("is_featured") === "true",
  }

  const parsed = dishSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

  const { data: last } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("restaurant_id", profile.restaurant_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from("dishes").insert({
    ...parsed.data,
    restaurant_id: profile.restaurant_id,
    sort_order: (last?.sort_order ?? -1) + 1,
    image_url: parsed.data.image_url || null,
    bunny_video_id: parsed.data.bunny_video_id || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/painel/pratos")
  return { success: true }
}

export async function updateDish(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    ingredients: formData.get("ingredients") || undefined,
    serves: formData.get("serves") || undefined,
    prep_time_min: formData.get("prep_time_min") || undefined,
    price_cents: formData.get("price_cents"),
    category_id: formData.get("category_id"),
    media_type: formData.get("media_type"),
    image_url: formData.get("image_url") || undefined,
    bunny_video_id: formData.get("bunny_video_id") || undefined,
    is_available: formData.get("is_available") === "true",
    is_featured: formData.get("is_featured") === "true",
  }

  const parsed = dishSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }

  const { error } = await supabase
    .from("dishes")
    .update({
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      bunny_video_id: parsed.data.bunny_video_id || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/painel/pratos")
  return { success: true }
}

export async function deleteDish(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("dishes").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/painel/pratos")
  return { success: true }
}

export async function toggleDishAvailability(id: string, value: boolean) {
  const supabase = await createClient()
  await supabase.from("dishes").update({ is_available: value }).eq("id", id)
  revalidatePath("/painel/pratos")
}

export async function toggleDishFeatured(id: string, value: boolean) {
  const supabase = await createClient()
  await supabase.from("dishes").update({ is_featured: value }).eq("id", id)
  revalidatePath("/painel/pratos")
}

export async function reorderDishes(ids: string[]) {
  const supabase = await createClient()
  await Promise.all(
    ids.map((id, index) =>
      supabase.from("dishes").update({ sort_order: index }).eq("id", id)
    )
  )
  revalidatePath("/painel/pratos")
}
