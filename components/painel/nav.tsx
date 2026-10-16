"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "cn"
import { UtensilsCrossed, LayoutGrid, ClipboardList, QrCode, BarChart2, LogOut, ChevronRight } from "lucide-react"

const links = [
  { href: "/painel/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/painel/pratos", label: "Pratos", icon: UtensilsCrossed },
  { href: "/painel/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/painel/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/painel/qr", label: "QR Code", icon: QrCode },
]

export function PainelNav({ restaurantName }: { restaurantName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const initial = restaurantName.charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-[#111111] border-r border-white/5">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-[11px] font-bold tracking-widest text-orange-500 uppercase mb-4">instaX</p>
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate leading-tight">{restaurantName}</p>
            <p className="text-zinc-500 text-xs mt-0.5">Painel do restaurante</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5 mb-3" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="size-3.5 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="mx-4 h-px bg-white/5 mt-3" />
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-all hover:text-red-400 hover:bg-red-400/5"
        >
          <LogOut className="size-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
