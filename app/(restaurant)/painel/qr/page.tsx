import { createClient } from "@/lib/supabase/server"

export const instant = false

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
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">QR Code</h1>
        <p className="text-zinc-500 text-sm mt-1">Compartilhe o link do seu cardápio</p>
      </div>
      {restaurant && (
        <div className="rounded-2xl bg-[#161616] border border-white/5 p-6 flex flex-col gap-4">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Link do cardápio</p>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 text-sm underline break-all hover:text-orange-300 transition-colors"
          >
            {menuUrl}
          </a>
          <div className="h-px bg-white/5" />
          <p className="text-zinc-600 text-xs">Geração de QR Code disponível em breve.</p>
        </div>
      )}
    </div>
  )
}
