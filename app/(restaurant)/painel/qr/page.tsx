import { createClient } from "@/lib/supabase/server"

export default async function QrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_id")
    .eq("user_id", user!.id)
    .single()

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug, name")
    .eq("id", profile!.restaurant_id!)
    .single()

  const menuUrl = restaurant ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/m/${restaurant.slug}` : ""

  return (
    <div className="p-6 max-w-sm">
      <h1 className="text-xl font-semibold mb-4">QR Code</h1>
      {restaurant && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Link do cardápio:</p>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">{menuUrl}</a>
          <p className="text-xs text-muted-foreground">Geração de QR Code disponível em breve.</p>
        </div>
      )}
    </div>
  )
}
