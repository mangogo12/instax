import { createClient } from "@supabase/supabase-js"
import { describe, it, expect, afterAll } from "vitest"
import type { Database } from "@/lib/supabase/types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESTAURANT_A_ID = "00000000-0000-0000-0000-000000000010"

const admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const createdUserIds: string[] = []

afterAll(async () => {
  for (const id of createdUserIds) {
    await admin.auth.admin.deleteUser(id)
  }
})

describe("Autenticação e perfis", () => {
  it("criação de usuário restaurant_admin popula profiles automaticamente", async () => {
    const { data } = await admin.auth.admin.createUser({
      email: "profile-test@instax.test",
      password: "senha-teste-prof-123",
      user_metadata: { role: "restaurant_admin", restaurant_id: RESTAURANT_A_ID },
      email_confirm: true,
    })
    const userId = data.user!.id
    createdUserIds.push(userId)

    const { data: profile } = await admin
      .from("profiles")
      .select("role, restaurant_id")
      .eq("user_id", userId)
      .single()

    expect(profile?.role).toBe("restaurant_admin")
    expect(profile?.restaurant_id).toBe(RESTAURANT_A_ID)
  })

  it("criação de usuário master popula profiles com role=master", async () => {
    const { data } = await admin.auth.admin.createUser({
      email: "master-test@instax.test",
      password: "senha-master-123",
      user_metadata: { role: "master" },
      email_confirm: true,
    })
    const userId = data.user!.id
    createdUserIds.push(userId)

    const { data: profile } = await admin
      .from("profiles")
      .select("role, restaurant_id")
      .eq("user_id", userId)
      .single()

    expect(profile?.role).toBe("master")
    expect(profile?.restaurant_id).toBeNull()
  })

  it("restaurant_admin não lê profiles de outros usuários", async () => {
    const { data: userA } = await admin.auth.admin.createUser({
      email: "admin-prof-a@instax.test",
      password: "senha-pa-123",
      user_metadata: { role: "restaurant_admin", restaurant_id: RESTAURANT_A_ID },
      email_confirm: true,
    })
    createdUserIds.push(userA.user!.id)

    const { data: userB } = await admin.auth.admin.createUser({
      email: "admin-prof-b@instax.test",
      password: "senha-pb-123",
      user_metadata: { role: "restaurant_admin", restaurant_id: RESTAURANT_A_ID },
      email_confirm: true,
    })
    createdUserIds.push(userB.user!.id)

    const clientA = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
    await clientA.auth.signInWithPassword({ email: "admin-prof-a@instax.test", password: "senha-pa-123" })

    const { data: profiles } = await clientA.from("profiles").select("*")

    const ids = profiles?.map((p) => p.user_id) ?? []
    expect(ids).not.toContain(userB.user!.id)
    expect(ids).toContain(userA.user!.id)
  })
})
