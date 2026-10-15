import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const apiKey = process.env.BUNNY_API_KEY
  const libraryId = process.env.BUNNY_LIBRARY_ID
  if (!apiKey || !libraryId) {
    return NextResponse.json({ error: "Bunny não configurado" }, { status: 503 })
  }

  const { title } = await req.json()

  const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ title: title ?? "Prato" }),
  })

  if (!createRes.ok) {
    return NextResponse.json({ error: "Erro ao criar vídeo no Bunny" }, { status: 502 })
  }

  const video = await createRes.json()
  const videoId: string = video.guid

  // Generate signature for TUS upload (expires in 1 hour)
  const expirationTime = Math.floor(Date.now() / 1000) + 3600
  const signature = crypto
    .createHash("sha256")
    .update(libraryId + apiKey + expirationTime + videoId)
    .digest("hex")

  return NextResponse.json({
    videoId,
    libraryId,
    expirationTime,
    signature,
  })
}
