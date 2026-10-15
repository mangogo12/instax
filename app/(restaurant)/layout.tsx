import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, restaurant_id")
    .eq("user_id", user.id)
    .single()

  if (profile?.role !== "restaurant_admin") redirect("/login")

  if (profile.restaurant_id) {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("status")
      .eq("id", profile.restaurant_id)
      .single()

    if (restaurant?.status === "blocked") redirect("/painel/bloqueado")
    if (restaurant?.status === "canceled") redirect("/login")
  }

  return <>{children}</>
}
