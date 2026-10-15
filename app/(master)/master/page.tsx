import { createAdminClient } from "@/lib/supabase/admin"
import { StatusToggle, CreateRestaurantForm } from "@/components/master/restaurant-actions"
import { ExternalLink } from "lucide-react"

export const instant = false

export default async function MasterPage() {
  const admin = createAdminClient()

  const [restaurantsRes, plansRes] = await Promise.all([
    admin
      .from("restaurants")
      .select("id, name, slug, status, tables_count, created_at, plans!plan_id(name)")
      .order("created_at", { ascending: false }),
    admin
      .from("plans")
      .select("id, name")
      .order("price_cents"),
  ])

  const restaurants = restaurantsRes.data ?? []
  const plans = plansRes.data ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Restaurantes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{restaurants.length} cadastrados</p>
        </div>
        <CreateRestaurantForm plans={plans} />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plano</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Mesas</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Criado</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {restaurants.map(r => {
              const plan = r.plans as any
              const createdAt = new Date(r.created_at).toLocaleDateString("pt-BR")
              return (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{plan?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.tables_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{createdAt}</td>
                  <td className="px-4 py-3">
                    <StatusToggle restaurantId={r.id} status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/m/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </td>
                </tr>
              )
            })}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Nenhum restaurante cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
