"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

async function assertMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("unauthenticated")
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()
  if (profile?.role !== "master") throw new Error("forbidden")
}

export async function createRestaurant(formData: FormData) {
  await assertMaster()

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const planId = formData.get("plan_id") as string
  const tablesCount = parseInt(formData.get("tables_count") as string) || 10
  const adminEmail = formData.get("admin_email") as string
  const adminPassword = formData.get("admin_password") as string

  if (!name || !slug || !planId || !adminEmail || !adminPassword) {
    return { error: "Preencha todos os campos" }
  }

  const admin = createAdminClient()

  const { data: restaurant, error: restError } = await admin
    .from("restaurants")
    .insert({ name, slug, plan_id: planId, tables_count: tablesCount })
    .select("id")
    .single()

  if (restError) {
    if (restError.message.includes("unique")) return { error: "Slug já em uso" }
    return { error: "Erro ao criar restaurante" }
  }

  const { error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      role: "restaurant_admin",
      restaurant_id: restaurant.id,
    },
  })

  if (userError) {
    await admin.from("restaurants").delete().eq("id", restaurant.id)
    if (userError.message.includes("already registered")) return { error: "E-mail já cadastrado" }
    return { error: "Erro ao criar usuário admin" }
  }

  revalidatePath("/master")
  return { success: true }
}

export async function setRestaurantStatus(restaurantId: string, status: "active" | "blocked" | "canceled") {
  await assertMaster()
  const admin = createAdminClient()
  const { error } = await admin.from("restaurants").update({ status }).eq("id", restaurantId)
  if (error) return { error: "Erro ao atualizar status" }
  revalidatePath("/master")
  return { success: true }
}
