import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const authError = searchParams.get("error_description") || searchParams.get("error")
  const next = searchParams.get("next") ?? "/dashboard"

  if (authError) {
    console.error("OAuth provider error:", authError)
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(authError)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("Missing authorization code")}`)
  }

  const supabase = await createClient()
  const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth callback exchange failed:", error.message)
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`)
  }

  if (session?.provider_refresh_token) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    const { error: tokenError } = await supabaseAdmin.from("user_tokens").upsert({
      user_id: session.user.id,
      refresh_token: session.provider_refresh_token,
      updated_at: new Date().toISOString(),
    })

    if (tokenError) {
      console.error("Failed to store refresh token:", tokenError.message)
      // Non-fatal — user is signed in; Gmail approval may fail until re-auth
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
