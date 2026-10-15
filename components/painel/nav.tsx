"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "cn"
import { UtensilsCrossed, LayoutGrid, ClipboardList, QrCode, BarChart2, LogOut } from "lucide-react"

const links = [
  { href: "/painel/pratos", label: "Pratos", icon: UtensilsCrossed },
  { href: "/painel/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/painel/dashboard", label: "Dashboard", icon: BarChart2 },
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

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs text-muted-foreground">Painel</p>
        <p className="font-semibold truncate">{restaurantName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
