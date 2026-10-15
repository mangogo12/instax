import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const instant = false

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profile?.role !== "master") redirect("/login")

  return <>{children}</>
}
