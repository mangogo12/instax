import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PainelNav } from "@/components/painel/nav"
import { Toaster } from "sonner"
import { connection } from "next/server"

export const instant = false

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  await connection()
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
      .select("status, name")
      .eq("id", profile.restaurant_id)
      .single()

    if (restaurant?.status === "blocked") redirect("/painel/bloqueado")
    if (restaurant?.status === "canceled") redirect("/login")

    return (
      <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
        <PainelNav restaurantName={restaurant?.name ?? ""} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster richColors />
      </div>
    )
  }

  return <>{children}</>
}
