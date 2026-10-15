"use client"

import { useState, useTransition } from "react"
import { setRestaurantStatus, createRestaurant } from "@/lib/actions/master"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"

type Status = "active" | "past_due" | "blocked" | "canceled"

export function StatusToggle({ restaurantId, status }: { restaurantId: string; status: Status }) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = status === "active" ? "blocked" : "active"
    startTransition(async () => {
      const res = await setRestaurantStatus(restaurantId, next)
      if (res.error) toast.error(res.error)
      else toast.success(`Status atualizado para ${next}`)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending || status === "canceled"}
      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
        status === "active"
          ? "bg-green-500/15 text-green-600 hover:bg-red-500/15 hover:text-red-600"
          : status === "blocked"
          ? "bg-red-500/15 text-red-600 hover:bg-green-500/15 hover:text-green-600"
          : "bg-zinc-500/15 text-zinc-500"
      }`}
    >
      {pending ? "..." : status === "active" ? "Ativo" : status === "blocked" ? "Bloqueado" : status === "past_due" ? "Inadimplente" : "Cancelado"}
    </button>
  )
}

export function CreateRestaurantForm({ plans }: { plans: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const res = await createRestaurant(data)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Restaurante criado!")
        setOpen(false)
        form.reset()
      }
    })
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = e.currentTarget.form?.elements.namedItem("slug") as HTMLInputElement
    if (slugInput && !slugInput.dataset.manual) {
      slugInput.value = e.target.value
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
      >
        + Novo restaurante
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4"
      >
        <h2 className="font-semibold text-lg">Novo restaurante</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <input name="name" required onChange={handleNameChange}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Slug (URL: /m/slug)</label>
            <input name="slug" required
              onInput={(e) => { (e.currentTarget as HTMLInputElement).dataset.manual = "1" }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary font-mono" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Plano</label>
              <select name="plan_id" required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground">Mesas</label>
              <input name="tables_count" type="number" min={1} max={200} defaultValue={10}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">E-mail do admin</label>
            <input name="admin_email" type="email" required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Senha temporária</label>
            <input name="admin_password" type="password" required minLength={8}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setOpen(false)}
            className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted">
            Cancelar
          </button>
          <button type="submit" disabled={pending}
            className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50">
            {pending ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
    </div>
  )
}
