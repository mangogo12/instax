import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (pathname.startsWith("/master")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (profile?.role !== "master") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  if (pathname.startsWith("/painel")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, restaurant_id")
      .eq("user_id", user.id)
      .single()

    if (profile?.role !== "restaurant_admin") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (profile.restaurant_id) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("status")
        .eq("id", profile.restaurant_id)
        .single()

      if (restaurant?.status === "blocked") {
        return NextResponse.redirect(new URL("/painel/bloqueado", request.url))
      }

      if (restaurant?.status === "canceled") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }
  }

  if (pathname === "/login" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (profile?.role === "master") {
      return NextResponse.redirect(new URL("/master", request.url))
    }
    if (profile?.role === "restaurant_admin") {
      return NextResponse.redirect(new URL("/painel", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/master/:path*", "/painel/:path*", "/login"],
}
