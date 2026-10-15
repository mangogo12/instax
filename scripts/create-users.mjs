import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

function loadEnv(p) {
  const env = {}
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([^=]+)=(.+)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const env = loadEnv("D:/instax/.env.local")
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  {
    email: "master@instax.com",
    password: "master123",
    meta: { role: "master" },
    label: "Master",
  },
  {
    email: "admin@demo-burguer.com",
    password: "demo123",
    meta: { role: "restaurant_admin", restaurant_id: "00000000-0000-0000-0000-000000000010" },
    label: "Admin Demo Burguer",
  },
]

for (const u of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    user_metadata: u.meta,
    email_confirm: true,
  })
  if (error) {
    console.log(`${u.label}: ERRO — ${error.message}`)
  } else {
    console.log(`${u.label}: criado (${data.user.id})`)
  }
}
