"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ActionItem = { text: string; owner?: string; deadline?: string; priority: "P0" | "P1" | "P2" }
type Decision = { text: string }
type TriageResult = { action_items: ActionItem[]; decisions: Decision[]; open_questions: Decision[] }

const PRIORITY_STYLES: Record<string, string> = {
  P0: "background:#FAECE7;color:#712B13",
  P1: "background:#FAEEDA;color:#633806",
  P2: "background:#F1EFE8;color:#444441"
}

export default function Page() {
  const [transcript, setTranscript] = useState("")
  const [result, setResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

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

  async function handleTriage() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, userId: session?.user?.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Meeting triage</h1>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
          Paste a meeting transcript and get structured action items, decisions, and open questions.
        </p>
        {!session ? (
          <button onClick={handleSignIn} style={{ padding: "6px 14px", fontSize: 13, borderRadius: 6, background: "#4285F4", color: "#fff", border: "none", cursor: "pointer" }}>
            Sign in with Google
          </button>
        ) : (
          <div style={{ fontSize: 13, color: "#444" }}>Signed in as {session.user.email}</div>
        )}
      </div>

      <textarea
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        placeholder="Paste your meeting transcript here..."
        style={{ width: "100%", minHeight: 160, padding: "10px 12px", fontSize: 14,
          border: "1px solid #ddd", borderRadius: 8, resize: "vertical", marginBottom: 12, color: "#000" }}
      />

      <button
        onClick={handleTriage}
        disabled={loading || !transcript.trim()}
        style={{ padding: "9px 20px", fontSize: 14, borderRadius: 8, border: "none",
          background: loading ? "#ccc" : "#111", color: "#fff", cursor: loading ? "default" : "pointer" }}
      >
        {loading ? "Triaging..." : "Triage meeting"}
      </button>

      {error && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: "#FCEBEB",
          color: "#A32D2D", borderRadius: 8, fontSize: 14 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24, color: "#000" }}>
          <Section title="Action items">
            {result.action_items.map((item, i) => (
              <div key={i} style={{ padding: "10px 14px", border: "0.5px solid #eee",
                borderRadius: 8, marginBottom: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 7px",
                  borderRadius: 6, flexShrink: 0, ...parseStyle(PRIORITY_STYLES[item.priority]) }}>
                  {item.priority}
                </span>
                <div>
                  <div style={{ fontSize: 14 }}>{item.text}</div>
                  {(item.owner || item.deadline) && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                      {item.owner && <span>{item.owner}</span>}
                      {item.owner && item.deadline && <span> · </span>}
                      {item.deadline && <span>{item.deadline}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Decisions">
            {result.decisions.map((d, i) => (
              <div key={i} style={{ fontSize: 14, padding: "8px 14px", borderLeft: "2px solid #ddd", marginBottom: 6 }}>
                {d.text}
              </div>
            ))}
          </Section>

          <Section title="Open questions">
            {result.open_questions.map((q, i) => (
              <div key={i} style={{ fontSize: 14, padding: "8px 14px", borderLeft: "2px solid #f0c040", marginBottom: 6 }}>
                {q.text}
              </div>
            ))}
          </Section>
        </div>
      )}
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 500, textTransform: "uppercase",
        letterSpacing: "0.06em", color: "#888", marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  )
}

function parseStyle(str: string): React.CSSProperties {
  if (!str) return {}
  return Object.fromEntries(str.split(";").filter(Boolean).map(s => {
    const [k, v] = s.split(":")
    return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.trim()]
  }))
}
