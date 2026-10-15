import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CardapioPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, status")
    .eq("slug", slug)
    .single()

  if (!restaurant) notFound()

  if (restaurant.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold">{restaurant.name}</h1>
          <p className="text-muted-foreground mt-2">Cardápio temporariamente indisponível.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-xl font-bold">{restaurant.name}</h1>
      <p className="text-muted-foreground mt-2">Feed em construção — Fase 3.</p>
    </div>
  )
}
