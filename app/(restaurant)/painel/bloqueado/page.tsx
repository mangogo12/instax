import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export const instant = false

export default async function BloqueadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let paymentLink: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .single()

    if (profile?.restaurant_id) {
      const { data: payment } = await supabase
        .from("payments")
        .select("payment_link_url")
        .eq("restaurant_id", profile.restaurant_id)
        .not("payment_link_url", "is", null)
        .order("due_date", { ascending: false })
        .limit(1)
        .single()

      paymentLink = payment?.payment_link_url ?? null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-xl">Conta bloqueada</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            O acesso foi suspenso por inadimplência. Regularize o pagamento para reativar.
          </p>
          {paymentLink && (
            <a href={paymentLink} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
              Pagar agora
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
