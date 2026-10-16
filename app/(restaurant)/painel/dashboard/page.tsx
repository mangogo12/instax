import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ViewsChart } from "@/components/painel/dashboard-chart"
import { Eye, ShoppingBag, TrendingUp, Heart } from "lucide-react"

export const instant = false

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .single()

  if (!profile?.restaurant_id) {
    return <div className="p-6 text-muted-foreground text-sm">Restaurante não configurado.</div>
  }

  const rid = profile.restaurant_id
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0)
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [eventsRes, ordersRes, likesRes, topDishesRes] = await Promise.all([
    // Events last 24h for hourly chart
    supabase
      .from("events")
      .select("created_at")
      .eq("restaurant_id", rid)
      .eq("type", "view")
      .gte("created_at", last24h.toISOString()),
    // Orders today
    supabase
      .from("orders")
      .select("total_cents, status")
      .eq("restaurant_id", rid)
      .gte("created_at", todayStart.toISOString()),
    // Likes total
    supabase
      .from("likes")
      .select("dish_id", { count: "exact", head: true })
      .eq("restaurant_id", rid),
    // Top dishes this week
    supabase
      .from("events")
      .select("dish_id, dishes!dish_id(name)")
      .eq("restaurant_id", rid)
      .eq("type", "view")
      .gte("created_at", weekStart.toISOString()),
  ])

  // Build hourly chart data
  const hourMap: Record<string, number> = {}
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600000)
    const label = `${String(d.getHours()).padStart(2, "0")}h`
    hourMap[label] = 0
  }
  for (const e of eventsRes.data ?? []) {
    const h = new Date(e.created_at).getHours()
    const label = `${String(h).padStart(2, "0")}h`
    if (label in hourMap) hourMap[label]++
  }
  const chartData = Object.entries(hourMap).map(([hour, views]) => ({ hour, views }))

  // Orders today
  const todayOrders = ordersRes.data ?? []
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_cents, 0)
  const todayViews = (eventsRes.data ?? []).filter(e => new Date(e.created_at) >= todayStart).length

  // Top dishes
  const dishCount: Record<string, { name: string; count: number }> = {}
  for (const e of topDishesRes.data ?? []) {
    const dish = e.dishes as any
    if (!dish) continue
    if (!dishCount[e.dish_id]) dishCount[e.dish_id] = { name: dish.name, count: 0 }
    dishCount[e.dish_id].count++
  }
  const topDishes = Object.values(dishCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const totalLikes = likesRes.count ?? 0

  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Métricas do seu cardápio</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: "Views hoje", value: todayViews.toLocaleString("pt-BR"), color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: ShoppingBag, label: "Pedidos hoje", value: todayOrders.length.toLocaleString("pt-BR"), color: "text-orange-400", bg: "bg-orange-500/10" },
          { icon: TrendingUp, label: "Receita hoje", value: (todayRevenue / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), color: "text-green-400", bg: "bg-green-500/10" },
          { icon: Heart, label: "Likes totais", value: totalLikes.toLocaleString("pt-BR"), color: "text-red-400", bg: "bg-red-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-2xl bg-[#161616] border border-white/5 p-5">
            <div className={`size-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <p className="text-zinc-500 text-xs font-medium">{label}</p>
            <p className="text-white text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 p-6">
        <p className="text-white text-sm font-semibold mb-4">Views por hora (últimas 24h)</p>
        <ViewsChart data={chartData} />
      </div>

      {/* Top dishes */}
      {topDishes.length > 0 && (
        <div className="rounded-2xl bg-[#161616] border border-white/5 p-6">
          <p className="text-white text-sm font-semibold mb-4">Pratos mais vistos (7 dias)</p>
          <ul className="space-y-3">
            {topDishes.map((dish, i) => (
              <li key={dish.name} className="flex items-center gap-3">
                <span className="text-zinc-600 text-xs font-mono w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-300 text-sm truncate">{dish.name}</p>
                  <div className="h-1.5 mt-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.round((dish.count / (topDishes[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-zinc-500 text-xs whitespace-nowrap">{dish.count} views</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
