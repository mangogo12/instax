import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MasterNav } from "@/components/master/nav"
import { Toaster } from "sonner"

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MasterNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster richColors />
    </div>
  )
}
