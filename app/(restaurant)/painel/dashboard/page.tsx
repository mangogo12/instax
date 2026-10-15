import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ViewsChart } from "@/components/painel/dashboard-chart"
import { Eye, ShoppingBag, TrendingUp, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Métricas do seu cardápio</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="size-4" /> Views hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayViews.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="size-4" /> Pedidos hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" /> Receita hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(todayRevenue / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="size-4" /> Likes totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLikes.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Views chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Views por hora (últimas 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ViewsChart data={chartData} />
        </CardContent>
      </Card>

      {/* Top dishes */}
      {topDishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pratos mais vistos (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topDishes.map((dish, i) => (
                <li key={dish.name} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{dish.name}</p>
                    <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.round((dish.count / (topDishes[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">{dish.count} views</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
