import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const next = requestUrl.searchParams.get("next")
  const origin = requestUrl.origin

  if (error) {
    const params = new URLSearchParams()
    params.set("error", error)
    if (errorDescription) {
      params.set("error_description", errorDescription)
    }
    return NextResponse.redirect(`${origin}/auth/login?${params.toString()}`)
  }

  if (code) {
    const supabase = await createServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const nextPath = next && next.startsWith("/") ? next : "/horizons"
  return NextResponse.redirect(`${origin}${nextPath}`)
}
