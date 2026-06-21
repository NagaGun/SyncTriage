"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LandingPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) router.push("/dashboard")
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) router.push("/dashboard")
    })
    return () => subscription.unsubscribe()
  }, [router])

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/calendar.events",
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (session) return null

  return (
    <>
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          Sync<span>Triage</span>
        </div>
        <button onClick={handleSignIn} className="btn-secondary btn-sm">
          Sign in with Google
        </button>
      </nav>

      {/* Hero */}
      <section className="landing-hero animate-in">
        <div className="landing-badge">
          ⚡ AI-Powered Meeting Intelligence
        </div>
        <h1 className="landing-title">
          Stop losing track of<br />
          <span className="accent-text">what was decided</span>
        </h1>
        <p className="landing-description">
          Paste any meeting transcript and let AI extract action items, decisions, 
          and open questions — then automatically draft follow-ups and schedule deadlines.
        </p>
        <button onClick={handleSignIn} className="landing-cta" id="cta-signin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Get Started with Google
        </button>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="feature-card animate-in" style={{ animationDelay: "0.1s" }}>
          <div className="feature-icon">🎯</div>
          <h3 className="feature-title">AI Extraction</h3>
          <p className="feature-desc">
            Gemini-powered analysis extracts action items with owners, deadlines, 
            and P0/P1/P2 priority levels from raw transcripts.
          </p>
        </div>

        <div className="feature-card animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="feature-icon">✅</div>
          <h3 className="feature-title">One-Click Approvals</h3>
          <p className="feature-desc">
            Review AI-staged follow-up emails and calendar events, then approve 
            or skip with a single click.
          </p>
        </div>

        <div className="feature-card animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="feature-icon">🔄</div>
          <h3 className="feature-title">Automatic Follow-ups</h3>
          <p className="feature-desc">
            Sent emails with no reply after 48 hours get automatically re-pinged. 
            Never let action items fall through the cracks.
          </p>
        </div>
      </section>
    </>
  )
}
