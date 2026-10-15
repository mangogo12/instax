import { createClient } from "@supabase/supabase-js"
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { Database } from "@/lib/supabase/types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const RESTAURANT_A_ID = "00000000-0000-0000-0000-000000000010"

const RESTAURANT_B_ID = "00000000-0000-0000-0000-000000000011"
const PLAN_ID = "00000000-0000-0000-0000-000000000001"

let adminAId: string
let adminBId: string

const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function signInAs(email: string, password: string) {
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

beforeAll(async () => {
  await admin.from("restaurants").insert({
    id: RESTAURANT_B_ID,
    slug: "test-restaurante-b",
    name: "Restaurante B (teste)",
    status: "active",
    plan_id: PLAN_ID,
    tables_count: 5,
  })

  const { data: userA } = await admin.auth.admin.createUser({
    email: "admin-a-test@instax.test",
    password: "senha-teste-a-123",
    user_metadata: { role: "restaurant_admin", restaurant_id: RESTAURANT_A_ID },
    email_confirm: true,
  })
  adminAId = userA.user!.id

  const { data: userB } = await admin.auth.admin.createUser({
    email: "admin-b-test@instax.test",
    password: "senha-teste-b-123",
    user_metadata: { role: "restaurant_admin", restaurant_id: RESTAURANT_B_ID },
    email_confirm: true,
  })
  adminBId = userB.user!.id
})

afterAll(async () => {
  if (adminAId) await admin.auth.admin.deleteUser(adminAId)
  if (adminBId) await admin.auth.admin.deleteUser(adminBId)
  await admin.from("restaurants").delete().eq("id", RESTAURANT_B_ID)
})

describe("Isolamento RLS entre restaurantes", () => {
  it("admin do restaurante A não lê pratos do restaurante B", async () => {
    await admin.from("dishes").insert({
      restaurant_id: RESTAURANT_B_ID,
      category_id: "00000000-0000-0000-0000-000000000022",
      name: "Prato exclusivo B",
      price_cents: 1000,
      media_type: "image",
    }).throwOnError()

    const clientA = await signInAs("admin-a-test@instax.test", "senha-teste-a-123")
    const { data, error } = await clientA.from("dishes").select("*").eq("restaurant_id", RESTAURANT_B_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it("admin do restaurante A não consegue inserir pratos no restaurante B", async () => {
    const clientA = await signInAs("admin-a-test@instax.test", "senha-teste-a-123")
    const { error } = await clientA.from("dishes").insert({
      restaurant_id: RESTAURANT_B_ID,
      category_id: "00000000-0000-0000-0000-000000000022",
      name: "Invasão",
      price_cents: 999,
      media_type: "image",
    })

    expect(error).not.toBeNull()
  })

  it("admin do restaurante A não lê pedidos do restaurante B", async () => {
    const clientA = await signInAs("admin-a-test@instax.test", "senha-teste-a-123")
    const { data } = await clientA.from("orders").select("*").eq("restaurant_id", RESTAURANT_B_ID)

    expect(data).toHaveLength(0)
  })

  it("admin do restaurante A não lê categorias do restaurante B", async () => {
    const clientA = await signInAs("admin-a-test@instax.test", "senha-teste-a-123")
    const { data } = await clientA.from("categories").select("*").eq("restaurant_id", RESTAURANT_B_ID)

    expect(data).toHaveLength(0)
  })

  it("admin do restaurante A não lê waiter_calls do restaurante B", async () => {
    const clientA = await signInAs("admin-a-test@instax.test", "senha-teste-a-123")
    const { data } = await clientA.from("waiter_calls").select("*").eq("restaurant_id", RESTAURANT_B_ID)

    expect(data).toHaveLength(0)
  })

  it("anônimo não acessa cardápio de restaurante bloqueado", async () => {
    await admin.from("restaurants").update({ status: "blocked" }).eq("id", RESTAURANT_B_ID)

    const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data } = await anonClient.from("restaurants").select("*").eq("id", RESTAURANT_B_ID)

    expect(data).toHaveLength(0)

    await admin.from("restaurants").update({ status: "active" }).eq("id", RESTAURANT_B_ID)
  })

  it("anônimo não acessa pratos de restaurante cancelado", async () => {
    await admin.from("restaurants").update({ status: "canceled" }).eq("id", RESTAURANT_B_ID)

    const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data } = await anonClient.from("dishes").select("*").eq("restaurant_id", RESTAURANT_B_ID)

    expect(data).toHaveLength(0)

    await admin.from("restaurants").update({ status: "active" }).eq("id", RESTAURANT_B_ID)
  })
})
